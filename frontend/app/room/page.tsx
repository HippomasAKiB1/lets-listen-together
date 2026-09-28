"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore, Member } from "@/store/roomStore";
import { getSocket, disconnectSocket } from "@/lib/socket";
import {
  initLocalStream,
  stopLocalStream,
  createPeer,
  getPeer,
  destroyAllPeers,
  setMuted,
  cleanupAudio,
} from "@/lib/webrtc";
import MemberList from "@/components/MemberList";
import ChatPanel from "@/components/ChatPanel";
import YouTubePlayer from "@/components/YouTubePlayer";
import ScreenShareViewer from "@/components/ScreenShareViewer";
import MusicControls from "@/components/MusicControls";
import ModeSelector from "@/components/ModeSelector";
import QueuePanel from "@/components/QueuePanel";
import FloatingReactions from "@/components/FloatingReactions";
import api from "@/lib/api";
import { useRef } from "react";

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id");

  const { token, userId, isAuthenticated } = useAuthStore();
  const {
    roomName,
    inviteCode,
    hostId,
    currentSong,
    setRoom,
    setMembers,
    setMemberSpeaking,
    setMemberMic,
    setHostId,
    setCurrentSong,
    setQueue,
    addReaction,
    addMessage,
    clearRoom,
  } = useRoomStore();

  const socketRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [micMuted, setMicMuted] = useState(true);
  const [micError, setMicError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const isHost = userId === hostId;

  // 1. Redirect if not authenticated or no roomId
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    } else if (!roomId) {
      router.push("/home");
    }
  }, [isAuthenticated, roomId, router]);

  // 2. Initialize connection, signaling, WebRTC
  useEffect(() => {
    if (!token || !roomId) return;

    let socket: any = null;

    const setup = async () => {
      try {
        // Pre-fetch room metadata so host and guests see room name & invite code immediately
        try {
          const roomRes = await api.get(`/rooms/${roomId}`);
          if (roomRes?.data) {
            setRoom({
              roomId,
              roomName: roomRes.data.room_name,
              hostId: roomRes.data.host_id,
              inviteCode: roomRes.data.invite_code,
              members: roomRes.data.members || [],
              currentSong: roomRes.data.current_song || {},
            });
          }
        } catch (e) {
          console.warn("Could not pre-fetch room metadata:", e);
        }

        // A. Capture microphone stream (default to muted)
        try {
          await initLocalStream();
          setMuted(true);
        } catch (err) {
          console.warn("Microphone access denied:", err);
          setMicError("Microphone access denied. You won't be able to speak, but you can listen.");
        }

        // B. Connect socket
        socket = getSocket(token, roomId);
        socketRef.current = socket;

        // C. Setup WebSocket event listeners
        socket.on("sync_state", (data: any) => {
          setRoom({
            roomId,
            roomName: data.room_name || data.roomName || useRoomStore.getState().roomName || "Listening Room",
            hostId: data.host_id,
            inviteCode: data.invite_code || data.inviteCode || useRoomStore.getState().inviteCode || "",
            members: data.members || [],
            queue: data.queue || [],
            currentSong: data.current_song || {},
          });
          setLoading(false);

          // Once synced, initiate WebRTC connections to everyone already in the room
          (data.members || []).forEach((member: Member) => {
            if (member.user_id !== userId) {
              // Create peer, we are initiator for existing members
              socket.emit("join_webrtc_mesh", { target_user_id: member.user_id });
            }
          });
        });

        socket.on("member_joined", (data: any) => {
          setMembers(data.members);
          addMessage({
            message_id: Math.random().toString(),
            username: "System",
            content: `${data.username} joined the room.`,
            sent_at: new Date().toISOString(),
          });
        });

        socket.on("member_left", (data: any) => {
          setMembers(data.members);
          addMessage({
            message_id: Math.random().toString(),
            username: "System",
            content: `${data.username} left the room.`,
            sent_at: new Date().toISOString(),
          });
        });

        socket.on("member_mic_changed", (data: any) => {
          setMemberMic(data.user_id, data.is_muted);
        });

        socket.on("member_speaking", (data: any) => {
          setMemberSpeaking(data.user_id, data.is_speaking);
        });

        socket.on("queue_updated", (data: any) => {
          setQueue(data.queue || []);
        });

        socket.on("song_ended", () => {
          setCurrentSong({ is_playing: false });
        });

        socket.on("host_transferred", (data: any) => {
          setHostId(data.new_host_id);
          addMessage({
            message_id: Math.random().toString(),
            username: "System",
            content: "👑 Room host role has been transferred.",
            sent_at: new Date().toISOString(),
          });
        });

        socket.on("kicked", (data: any) => {
          alert(data.reason || "You were removed from the room by the host.");
          cleanupAndLeave();
        });

        socket.on("reaction_received", (data: any) => {
          addReaction(data);
          setTimeout(() => {
            useRoomStore.getState().removeReaction(data.id);
          }, 3500);
        });

        // WebRTC Signaling Relay
        socket.on("webrtc_offer", (data: any) => {
          let peer = getPeer(data.from_sid);
          if (!peer) {
            peer = createPeer(data.from_sid, data.user_id, data.username, false, socket);
          }
          peer.signal(data.signal);
        });

        socket.on("webrtc_answer", (data: any) => {
          const peer = getPeer(data.from_sid);
          if (peer) {
            peer.signal(data.signal);
          }
        });

        socket.on("webrtc_ice", (data: any) => {
          const peer = getPeer(data.from_sid);
          if (peer) {
            peer.signal(data.signal);
          }
        });

        socket.on("initiate_peer", (data: any) => {
          let peer = getPeer(data.sid);
          if (!peer) {
            createPeer(data.sid, data.user_id, data.username, true, socket);
          }
        });

        // Sync Music states
        socket.on("play", (payload: any) => {
          setCurrentSong({ ...payload, is_playing: true });
        });

        socket.on("pause", (payload: any) => {
          setCurrentSong({ is_playing: false, position_ms: payload.position_ms, server_timestamp: payload.server_timestamp });
        });

        socket.on("seek", (payload: any) => {
          setCurrentSong({ position_ms: payload.position_ms, server_timestamp: payload.server_timestamp });
        });

        socket.on("mode_changed", (payload: any) => {
          setCurrentSong({ mode: payload.mode });
        });

        socket.on("chat_message", (msg: any) => {
          addMessage(msg);
        });

        socket.on("room_ended", (data: any) => {
          alert(data.reason || "Room has been ended.");
          cleanupAndLeave();
        });

      } catch (err) {
        console.error("Room connection setup failed", err);
        setLoading(false);
      }
    };

    setup();

    return () => {
      cleanupAndLeave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roomId]);

  const cleanupAndLeave = () => {
    destroyAllPeers();
    stopLocalStream();
    cleanupAudio();
    disconnectSocket();
    clearRoom();
    router.push("/home");
  };

  const handleMuteToggle = () => {
    const next = !micMuted;
    setMicMuted(next);
    setMuted(next);
    socketRef.current?.emit("toggle_mic", { is_muted: next });
  };

  const handleSendReaction = (emoji: string) => {
    socketRef.current?.emit("send_reaction", { emoji });
  };

  const handleCopyLink = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (isHost) {
      if (confirm("You are the host. Leaving will end the room for everyone. Proceed?")) {
        const socket = getSocket(token!, roomId!);
        socket.emit("end_room", {});
        cleanupAndLeave();
      }
    } else {
      cleanupAndLeave();
    }
  };

  if (!isAuthenticated() || !roomId) return null;
  
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--ink)",
        padding: "24px",
      }}>
        <div className="card" style={{ maxWidth: "420px", width: "100%", textAlign: "center", padding: "32px 24px" }}>
          <div style={{
            background: "var(--ink)",
            color: "var(--accent-alt)",
            border: "var(--border)",
            padding: "16px",
            fontSize: "14px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            marginBottom: "16px",
          }}>
            LOADING ROOM...<span className="cursor-blink">_</span>
          </div>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--muted)" }}>
            CONNECTING TO AUDIO & QUEUE…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      color: "var(--ink)",
      overflow: "hidden",
    }}>
      {/* ── TOP HEADER ── */}
      <header style={{
        height: "56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: "var(--border)",
        background: "var(--ink)",
        color: "var(--ink-light)",
        zIndex: 5,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="Tune Together"
            width={120}
            height={44}
            priority
            className="logo-glow-dark"
            style={{ height: "44px", width: "auto", objectFit: "contain" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}>
                {roomName || "LISTENING ROOM"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted-light)", fontFamily: "var(--font-mono)" }}>CODE:</span>
              <code style={{
                background: "var(--accent-alt)",
                color: "#0A0A0A",
                border: "1px solid #0A0A0A",
                padding: "1px 6px",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-mono)",
              }}>
                {inviteCode || "—"}
              </code>
              {inviteCode && (
                <>
                  <button
                    onClick={handleCopyCode}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "1px 6px", fontSize: "10px", height: "auto" }}
                    title="COPY INVITE CODE"
                  >
                    {copiedCode ? "COPIED" : "COPY CODE"}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-primary btn-sm"
                    style={{ padding: "1px 8px", fontSize: "10px", height: "auto" }}
                    title="COPY DIRECT JOIN LINK"
                  >
                    {copiedLink ? "LINK COPIED" : "COPY LINK"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <button onClick={handleLeaveRoom} className="btn btn-danger btn-sm">
          {isHost ? "END ROOM" : "LEAVE ROOM"}
        </button>
      </header>

      {/* ── MAIN CONTENT GRID ── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Members List (Left) */}
        <MemberList />

        {/* Center Panel (Playback controls and selector) */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "var(--bg)",
          borderRight: "var(--border)",
        }}>
          {/* Mode switch */}
          <ModeSelector />

          {/* YouTube controller search */}
          {currentSong.mode === "youtube" && <MusicControls />}

          {/* Player zone */}
          <div style={{ flex: 1, minHeight: 0, position: "relative", background: currentSong.mode === "screenshare" ? "#000000" : "var(--bg)" }}>
            {currentSong.mode === "youtube" ? <YouTubePlayer /> : <ScreenShareViewer />}
            <FloatingReactions />
          </div>

          {/* Bottom Bar Controls */}
          <footer style={{
            height: "52px",
            padding: "0 20px",
            borderTop: "var(--border)",
            background: "var(--surface)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}>
            {/* Left: Mic toggle & status */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={handleMuteToggle}
                className={`btn ${micMuted ? "btn-danger" : "btn-secondary"} btn-sm`}
                id="footer-mute"
                style={{ padding: "6px 12px", fontSize: "11px" }}
              >
                {micMuted ? "MIC OFF" : "MIC ON"}
              </button>
              {micError && (
                <span style={{ fontSize: "11px", color: "var(--error)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  MIC ACCESS DENIED
                </span>
              )}
            </div>

            {/* Center: Live Flat Reaction Emojis Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--bg)",
              padding: "2px 6px",
              border: "var(--border-thin)",
            }}>
              <span style={{ fontSize: "10px", color: "var(--ink)", marginRight: "4px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                REACT:
              </span>
              {["🔥", "❤️", "😂", "👏", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: "14px",
                    padding: "2px 6px",
                    height: "auto",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                  title={`SEND ${emoji} REACTION`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Right: Queue button & branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <QueuePanel />
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--muted)" }}>
                TUNETOGETHER
              </span>
            </div>
          </footer>
        </div>

        {/* Chat Panel (Right) */}
        <ChatPanel />
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>🌀</div>
          <p>Loading layout...</p>
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
