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

  const { token, userId, username, isAuthenticated } = useAuthStore();
  const {
    roomName,
    inviteCode,
    hostId,
    currentSong,
    queue,
    setRoom,
    setMembers,
    setMemberSpeaking,
    setMemberMic,
    setHostId,
    setCurrentSong,
    setQueue,
    addReaction,
    removeReaction,
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
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "18px" }}>
            <Image
              src="/assets/app-logo-trans.png"
              alt="TuneTogether Logo"
              width={64}
              height={64}
              priority
              style={{ objectFit: "contain", filter: "drop-shadow(0 6px 20px rgba(139,92,246,0.5))" }}
              className="pulse-glow"
            />
          </div>
          <p style={{ fontSize: "16px", fontWeight: "700", color: "#F8FAFC" }}>
            Connecting to TuneTogether room…
          </p>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Syncing audio engine & WebRTC voice mesh
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-primary)",
      overflow: "hidden",
    }}>
      {/* Top Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        zIndex: 5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="TuneTogether Logo"
            width={34}
            height={34}
            style={{ objectFit: "contain" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {roomName || "Listening Room"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Code:</span>
              <code style={{
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.06em",
                color: "#C4B5FD",
                fontFamily: "monospace",
              }}>
                {inviteCode || "—"}
              </code>
              {inviteCode && (
                <>
                  <button
                    onClick={handleCopyCode}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "2px 8px", height: "auto", fontSize: "11px", color: "var(--text-secondary)" }}
                    title="Copy Invite Code"
                  >
                    {copiedCode ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 10px", height: "auto", fontSize: "11px", borderRadius: "14px", fontWeight: 600 }}
                    title="Copy Direct Join Link"
                  >
                    {copiedLink ? "✓ Link Copied!" : "🔗 Share Link"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <button onClick={handleLeaveRoom} className="btn btn-danger btn-sm">
          {isHost ? "🔴 End Room" : "🚪 Leave Room"}
        </button>
      </header>

      {/* Main content grid */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Members List (Left) */}
        <MemberList />

        {/* Center Panel (Playback controls and selector) */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "var(--bg-primary)",
        }}>
          {/* Mode switch */}
          <ModeSelector />

          {/* YouTube controller search */}
          {currentSong.mode === "youtube" && <MusicControls />}

          {/* Player zone */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {currentSong.mode === "youtube" ? <YouTubePlayer /> : <ScreenShareViewer />}
            <FloatingReactions />
          </div>

          {/* Bottom Bar Controls */}
          <footer style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}>
            {/* Left: Mic toggle & status */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleMuteToggle}
                className={`btn ${micMuted ? "btn-danger" : "btn-secondary"} btn-sm`}
                id="footer-mute"
                style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "12px" }}
              >
                {micMuted ? "🔇 Mic Muted" : "🎙️ Mic On"}
              </button>
              {micError && (
                <span style={{ fontSize: "12px", color: "var(--warning)" }}>
                  {micError}
                </span>
              )}
            </div>

            {/* Center: Live Floating Reaction Emojis Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "3px 8px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "2px", fontWeight: 600 }}>
                React:
              </span>
              {["🔥", "❤️", "😂", "👏", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: "16px",
                    padding: "2px 6px",
                    height: "auto",
                    borderRadius: "12px",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  title={`Send ${emoji} reaction`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Right: Queue button & branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <QueuePanel />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                TuneTogether
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
