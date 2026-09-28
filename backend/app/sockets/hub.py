"""
Socket.io event hub — manages all real-time communication:
- Room member presence (join/leave)
- WebRTC signaling relay (voice + screenshare)
- Music sync (YouTube play/pause/seek)
- Screenshare mode switching
- Text chat
"""

import asyncio
import time
import socketio
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal
from app.models.room import Room, RoomMember, Message, CurrentSong
from app.auth.jwt import verify_token

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# In-memory room state: { room_id: { sid: { user_id, username, is_muted, is_speaking } } }
room_sessions: dict[str, dict[str, dict]] = {}

# In-memory queues: { room_id: [ { video_id, song_title, artist, thumbnail_url, duration_seconds, added_by } ] }
room_queues: dict[str, list[dict]] = {}

# SID → room_id lookup for disconnect cleanup
sid_to_room: dict[str, str] = {}

# Pending host-disconnect tasks: room_id → asyncio.Task (grace period)
_host_disconnect_tasks: dict[str, asyncio.Task] = {}


def _get_members_list(room_id: str) -> list[dict]:
    """Return current members as a deduplicated list with mic/speaking states."""
    if room_id not in room_sessions:
        return []
    seen = {}
    for sid, info in room_sessions[room_id].items():
        uid = info["user_id"]
        seen[uid] = {
            "user_id": uid,
            "username": info["username"],
            "is_muted": info.get("is_muted", True),
            "is_speaking": info.get("is_speaking", False),
        }
    return list(seen.values())


# ─────────────────────────────────────────────
# Connection / Disconnection
# ─────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    """Authenticate and register the client into its room."""
    try:
        token = (auth or {}).get("token", "")
        if not token:
            # Try query string fallback
            qs = environ.get("QUERY_STRING", "")
            for part in qs.split("&"):
                if part.startswith("token="):
                    token = part[6:]
                    break

        user = verify_token(token)
    except Exception:
        await sio.disconnect(sid)
        return False

    # Room ID from query string
    qs = environ.get("QUERY_STRING", "")
    room_id = ""
    for part in qs.split("&"):
        if part.startswith("room_id="):
            room_id = part[8:]
            break

    if not room_id:
        await sio.disconnect(sid)
        return False

    # Register in memory
    if room_id not in room_sessions:
        room_sessions[room_id] = {}
    room_sessions[room_id][sid] = {
        "user_id": user["user_id"],
        "username": user["username"],
        "is_muted": True,
        "is_speaking": False,
    }
    sid_to_room[sid] = room_id

    await sio.enter_room(sid, room_id)

    # Send sync_state to this new client
    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()

        room_result = await db.execute(
            select(Room).where(Room.room_id == room_id)
        )
        room = room_result.scalar_one_or_none()

        # If host reconnected, cancel any pending host-disconnect grace timer
        if room and user["user_id"] == room.host_id:
            existing_task = _host_disconnect_tasks.pop(room_id, None)
            if existing_task and not existing_task.done():
                existing_task.cancel()

    await sio.emit(
        "sync_state",
        {
            "room_id": room_id,
            "room_name": room.room_name if room else "Listening Room",
            "invite_code": room.invite_code if room else "",
            "max_members": room.max_members if room else 8,
            "host_id": room.host_id if room else None,
            "members": _get_members_list(room_id),
            "queue": room_queues.get(room_id, []),
            "current_song": {
                "video_id": song.video_id if song else None,
                "song_title": song.song_title if song else None,
                "artist": song.artist if song else None,
                "thumbnail_url": song.thumbnail_url if song else None,
                "duration_seconds": song.duration_seconds if song else 0,
                "position_ms": song.position_ms if song else 0,
                "is_playing": song.is_playing if song else False,
                "server_timestamp": song.server_timestamp if song else 0,
                "mode": song.mode if song else "youtube",
            } if song else {},
        },
        to=sid,
    )

    # Broadcast member joined to rest of room
    await sio.emit(
        "member_joined",
        {
            "user_id": user["user_id"],
            "username": user["username"],
            "members": _get_members_list(room_id),
        },
        room=room_id,
        skip_sid=sid,
    )


@sio.event
async def disconnect(sid):
    """Clean up when a client disconnects."""
    room_id = sid_to_room.pop(sid, None)
    if not room_id or room_id not in room_sessions:
        return

    user_info = room_sessions[room_id].pop(sid, None)
    if not user_info:
        return

    # Check if the disconnected user was the host
    async with AsyncSessionLocal() as db:
        room_result = await db.execute(
            select(Room).where(Room.room_id == room_id)
        )
        room = room_result.scalar_one_or_none()

        is_host = room and room.host_id == user_info["user_id"]

        if is_host:
            # Give the host a 300-second grace period to reconnect (e.g. page refresh, tab switch, sharing code)
            # Cancel any existing task for this room first
            existing_task = _host_disconnect_tasks.pop(room_id, None)
            if existing_task and not existing_task.done():
                existing_task.cancel()

            async def _end_room_after_grace(rid: str, uid: str):
                await asyncio.sleep(300)
                # Check if host reconnected (any session with same user_id)
                sessions = room_sessions.get(rid, {})
                reconnected = any(
                    info["user_id"] == uid for info in sessions.values()
                )
                if reconnected:
                    _host_disconnect_tasks.pop(rid, None)
                    return
                # Actually end the room
                async with AsyncSessionLocal() as db2:
                    r2 = await db2.execute(select(Room).where(Room.room_id == rid))
                    room2 = r2.scalar_one_or_none()
                    if room2:
                        room2.is_active = False
                        db2.add(room2)
                    await db2.execute(delete(RoomMember).where(RoomMember.room_id == rid))
                    await db2.commit()
                await sio.emit("room_ended", {"reason": "Host left the room"}, room=rid)
                room_sessions.pop(rid, None)
                _host_disconnect_tasks.pop(rid, None)

            task = asyncio.create_task(_end_room_after_grace(room_id, user_info["user_id"]))
            _host_disconnect_tasks[room_id] = task
        else:
            # Remove from DB
            await db.execute(
                delete(RoomMember).where(
                    RoomMember.room_id == room_id,
                    RoomMember.user_id == user_info["user_id"],
                )
            )
            await db.commit()

            await sio.emit(
                "member_left",
                {
                    "user_id": user_info["user_id"],
                    "username": user_info["username"],
                    "members": _get_members_list(room_id),
                },
                room=room_id,
            )


# ─────────────────────────────────────────────
# WebRTC Signaling Relay
# ─────────────────────────────────────────────

@sio.on("join_webrtc_mesh")
async def join_webrtc_mesh(sid, data):
    """Triggered by a newly joined client requesting to mesh with existing members."""
    room_id = sid_to_room.get(sid)
    if not room_id or room_id not in room_sessions:
        return

    target_user_id = data.get("target_user_id")
    if not target_user_id:
        return

    # Find the target user's socket SID in this room
    target_sid = None
    for current_sid, info in room_sessions[room_id].items():
        if info["user_id"] == target_user_id:
            target_sid = current_sid
            break

    if target_sid and target_sid != sid:
        # Ask target client to initiate WebRTC connection with joining client
        user_info = room_sessions[room_id][sid]
        await sio.emit(
            "initiate_peer",
            {
                "sid": sid,
                "user_id": user_info["user_id"],
                "username": user_info["username"],
            },
            to=target_sid,
        )


@sio.on("webrtc_offer")
async def webrtc_offer(sid, data):
    """Relay WebRTC offer to target peer."""
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("webrtc_offer", {**data, "from_sid": sid}, to=target_sid)


@sio.on("webrtc_answer")
async def webrtc_answer(sid, data):
    """Relay WebRTC answer to target peer."""
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("webrtc_answer", {**data, "from_sid": sid}, to=target_sid)


@sio.on("webrtc_ice")
async def webrtc_ice(sid, data):
    """Relay ICE candidate to target peer."""
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("webrtc_ice", {**data, "from_sid": sid}, to=target_sid)


# ─────────────────────────────────────────────
# Music Sync — YouTube Mode
# ─────────────────────────────────────────────

async def _verify_host(sid, room_id: str) -> bool:
    """Returns True if the sid belongs to the room host."""
    async with AsyncSessionLocal() as db:
        room_result = await db.execute(select(Room).where(Room.room_id == room_id))
        room = room_result.scalar_one_or_none()
    if not room:
        return False
    user_info = room_sessions.get(room_id, {}).get(sid, {})
    return user_info.get("user_id") == room.host_id


@sio.on("host_play")
async def host_play(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    server_ts = int(time.time() * 1000)
    payload = {
        "event": "play",
        "video_id": data.get("video_id"),
        "song_title": data.get("song_title"),
        "artist": data.get("artist"),
        "thumbnail_url": data.get("thumbnail_url"),
        "duration_seconds": data.get("duration_seconds", 0),
        "position_ms": data.get("position_ms", 0),
        "server_timestamp": server_ts,
    }

    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()
        if song:
            song.video_id = payload["video_id"]
            song.song_title = payload["song_title"]
            song.artist = payload["artist"]
            song.thumbnail_url = payload["thumbnail_url"]
            song.duration_seconds = payload["duration_seconds"]
            song.position_ms = payload["position_ms"]
            song.is_playing = True
            song.server_timestamp = server_ts
            song.mode = "youtube"
            db.add(song)
            await db.commit()

    await sio.emit("play", payload, room=room_id)


@sio.on("host_pause")
async def host_pause(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    server_ts = int(time.time() * 1000)
    position_ms = data.get("position_ms", 0)

    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()
        if song:
            song.position_ms = position_ms
            song.is_playing = False
            song.server_timestamp = server_ts
            db.add(song)
            await db.commit()

    await sio.emit(
        "pause",
        {"event": "pause", "position_ms": position_ms, "server_timestamp": server_ts},
        room=room_id,
    )


@sio.on("host_seek")
async def host_seek(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    server_ts = int(time.time() * 1000)
    position_ms = data.get("position_ms", 0)

    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()
        if song:
            song.position_ms = position_ms
            song.server_timestamp = server_ts
            db.add(song)
            await db.commit()

    await sio.emit(
        "seek",
        {"event": "seek", "position_ms": position_ms, "server_timestamp": server_ts},
        room=room_id,
    )


# ─────────────────────────────────────────────
# Screenshare Mode
# ─────────────────────────────────────────────

@sio.on("screenshare_started")
async def screenshare_started(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()
        if song:
            song.mode = "screenshare"
            song.is_playing = False
            db.add(song)
            await db.commit()

    await sio.emit(
        "mode_changed",
        {"mode": "screenshare", "host_sid": sid},
        room=room_id,
    )


@sio.on("screenshare_ended")
async def screenshare_ended(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()
        if song:
            song.mode = "youtube"
            db.add(song)
            await db.commit()

    await sio.emit("mode_changed", {"mode": "youtube"}, room=room_id)


# ─────────────────────────────────────────────
# Chat
# ─────────────────────────────────────────────

@sio.on("send_chat")
async def send_chat(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id:
        return

    user_info = room_sessions.get(room_id, {}).get(sid)
    if not user_info:
        return

    content = str(data.get("content", "")).strip()
    if not content or len(content) > 500:
        return

    async with AsyncSessionLocal() as db:
        message = Message(
            room_id=room_id,
            user_id=user_info["user_id"],
            username=user_info["username"],
            content=content,
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)

    await sio.emit(
        "chat_message",
        {
            "message_id": message.message_id,
            "username": user_info["username"],
            "content": content,
            "sent_at": message.sent_at.isoformat(),
        },
        room=room_id,
    )


# ─────────────────────────────────────────────
# Host End Room
# ─────────────────────────────────────────────

@sio.on("end_room")
async def end_room(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    async with AsyncSessionLocal() as db:
        room_result = await db.execute(select(Room).where(Room.room_id == room_id))
        room = room_result.scalar_one_or_none()
        if room:
            room.is_active = False
            db.add(room)
        await db.execute(delete(RoomMember).where(RoomMember.room_id == room_id))
        await db.commit()

    await sio.emit("room_ended", {"reason": "Host ended the room"}, room=room_id)
    room_sessions.pop(room_id, None)
    room_queues.pop(room_id, None)


# ─────────────────────────────────────────────
# Song End & Queue Autoplay
# ─────────────────────────────────────────────

@sio.on("host_song_ended")
async def host_song_ended(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return

    # Check if there is an up next song in the queue
    queue = room_queues.get(room_id, [])
    if queue:
        next_song = queue.pop(0)
        server_ts = int(time.time() * 1000)
        async with AsyncSessionLocal() as db:
            song_result = await db.execute(
                select(CurrentSong).where(CurrentSong.room_id == room_id)
            )
            song = song_result.scalar_one_or_none()
            if song:
                song.video_id = next_song.get("video_id")
                song.song_title = next_song.get("song_title")
                song.artist = next_song.get("artist")
                song.thumbnail_url = next_song.get("thumbnail_url")
                song.duration_seconds = next_song.get("duration_seconds", 0)
                song.position_ms = 0
                song.is_playing = True
                song.server_timestamp = server_ts
                song.mode = "youtube"
                db.add(song)
                await db.commit()

        await sio.emit("queue_updated", {"queue": queue}, room=room_id)
        await sio.emit(
            "play",
            {
                "event": "play",
                "video_id": next_song.get("video_id"),
                "song_title": next_song.get("song_title"),
                "artist": next_song.get("artist"),
                "thumbnail_url": next_song.get("thumbnail_url"),
                "duration_seconds": next_song.get("duration_seconds", 0),
                "position_ms": 0,
                "server_timestamp": server_ts,
            },
            room=room_id,
        )
        return

    # No queue, mark finished
    async with AsyncSessionLocal() as db:
        song_result = await db.execute(
            select(CurrentSong).where(CurrentSong.room_id == room_id)
        )
        song = song_result.scalar_one_or_none()
        if song:
            song.is_playing = False
            song.position_ms = (song.duration_seconds or 0) * 1000
            db.add(song)
            await db.commit()

    await sio.emit("song_ended", {"video_id": data.get("video_id")}, room=room_id)


# ─────────────────────────────────────────────
# Mic & Voice Activity Status
# ─────────────────────────────────────────────

@sio.on("toggle_mic")
async def toggle_mic(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or room_id not in room_sessions:
        return
    user_info = room_sessions[room_id].get(sid)
    if not user_info:
        return
    is_muted = bool(data.get("is_muted", True))
    user_info["is_muted"] = is_muted
    await sio.emit(
        "member_mic_changed",
        {"user_id": user_info["user_id"], "is_muted": is_muted},
        room=room_id,
    )


@sio.on("speaking_status")
async def speaking_status(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or room_id not in room_sessions:
        return
    user_info = room_sessions[room_id].get(sid)
    if not user_info:
        return
    is_speaking = bool(data.get("is_speaking", False))
    user_info["is_speaking"] = is_speaking
    await sio.emit(
        "member_speaking",
        {"user_id": user_info["user_id"], "is_speaking": is_speaking},
        room=room_id,
    )


# ─────────────────────────────────────────────
# Queue / Up Next Playlist
# ─────────────────────────────────────────────

@sio.on("add_to_queue")
async def add_to_queue(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id:
        return
    if room_id not in room_queues:
        room_queues[room_id] = []

    song = {
        "video_id": data.get("video_id"),
        "song_title": data.get("song_title"),
        "artist": data.get("artist"),
        "thumbnail_url": data.get("thumbnail_url"),
        "duration_seconds": data.get("duration_seconds", 0),
        "added_by": room_sessions.get(room_id, {}).get(sid, {}).get("username", "Member"),
    }
    room_queues[room_id].append(song)
    await sio.emit("queue_updated", {"queue": room_queues[room_id]}, room=room_id)


@sio.on("remove_from_queue")
async def remove_from_queue(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return
    idx = data.get("index")
    queue = room_queues.get(room_id, [])
    if isinstance(idx, int) and 0 <= idx < len(queue):
        queue.pop(idx)
        await sio.emit("queue_updated", {"queue": queue}, room=room_id)


@sio.on("clear_queue")
async def clear_queue(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return
    room_queues[room_id] = []
    await sio.emit("queue_updated", {"queue": []}, room=room_id)


# ─────────────────────────────────────────────
# Moderation: Transfer Host & Kick Member
# ─────────────────────────────────────────────

@sio.on("transfer_host")
async def transfer_host(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return
    new_host_id = data.get("new_host_id")
    if not new_host_id:
        return

    async with AsyncSessionLocal() as db:
        room_result = await db.execute(select(Room).where(Room.room_id == room_id))
        room = room_result.scalar_one_or_none()
        if room:
            room.host_id = new_host_id
            db.add(room)
            await db.commit()

    await sio.emit("host_transferred", {"new_host_id": new_host_id}, room=room_id)


@sio.on("kick_member")
async def kick_member(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id or not await _verify_host(sid, room_id):
        return
    target_user_id = data.get("user_id")
    if not target_user_id:
        return

    # Find target SID
    target_sids = [
        s for s, info in room_sessions.get(room_id, {}).items()
        if info["user_id"] == target_user_id
    ]

    async with AsyncSessionLocal() as db:
        await db.execute(
            delete(RoomMember).where(
                RoomMember.room_id == room_id,
                RoomMember.user_id == target_user_id,
            )
        )
        await db.commit()

    for tsid in target_sids:
        await sio.emit("kicked", {"reason": "You were removed from the room by the host."}, to=tsid)
        room_sessions[room_id].pop(tsid, None)
        sid_to_room.pop(tsid, None)
        try:
            await sio.disconnect(tsid)
        except Exception:
            pass

    await sio.emit(
        "member_left",
        {
            "user_id": target_user_id,
            "username": "A member",
            "members": _get_members_list(room_id),
        },
        room=room_id,
    )


# ─────────────────────────────────────────────
# Real-Time Floating Reactions (Emoji Bar)
# ─────────────────────────────────────────────

@sio.on("send_reaction")
async def send_reaction(sid, data):
    room_id = sid_to_room.get(sid)
    if not room_id:
        return
    user_info = room_sessions.get(room_id, {}).get(sid, {})
    emoji = data.get("emoji", "❤️")
    await sio.emit(
        "reaction_received",
        {
            "id": f"{sid}-{time.time()}",
            "emoji": emoji,
            "username": user_info.get("username", "Member"),
        },
        room=room_id,
    )

