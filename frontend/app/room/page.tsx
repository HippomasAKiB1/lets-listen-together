"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore, Member } from "@/store/roomStore";
import { getSocket, disconnectSocket } from "@/lib/socket";
import {
  initLocalStream,
  stopLocalStream,
  createPeer,
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
    setRoom,
    setMembers,
    setCurrentSong,
    addMessage,
    clearRoom,
  } = useRoomStore();

  const [loading, setLoading] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [micError, setMicError] = useState("");
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
        // A. Capture microphone stream
        try {
          await initLocalStream();
        } catch (err) {
          console.warn("Microphone access denied:", err);
          setMicError("Microphone access denied. You won't be able to speak, but you can listen.");
        }

        // B. Connect socket
        socket = getSocket(token, roomId);

        // C. Setup WebSocket event listeners
        socket.on("sync_state", (data: any) => {
          setRoom({
            roomId,
            roomName: data.roomName || roomName || "Listening Room",
            hostId: data.host_id,
            inviteCode: inviteCode || "",
            members: data.members || [],
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

        // WebRTC Signaling Relay
        socket.on("webrtc_offer", (data: any) => {
          const peer = createPeer(data.from_sid, data.user_id, data.username, false, socket);
          peer.signal(data.signal);
        });

        socket.on("webrtc_answer", (data: any) => {
          const peer = createPeer(data.from_sid, data.user_id, data.username, false, socket);
          peer.signal(data.signal);
        });

        socket.on("webrtc_ice", (data: any) => {
          const peer = createPeer(data.from_sid, data.user_id, data.username, false, socket);
          peer.signal(data.signal);
        });

        socket.on("initiate_peer", (data: any) => {
          createPeer(data.sid, data.user_id, data.username, true, socket);
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
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>🌀</div>
          <p>Connecting to TuneTogether room...</p>
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
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        zIndex: 5,
      }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "700" }}>{roomName || "Listening Room"}</h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Invite code:</span>
            <code style={{
              background: "var(--bg-card)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#A78BFA",
            }}>{inviteCode}</code>
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
          <div style={{ flex: 1, minHeight: 0 }}>
            {currentSong.mode === "youtube" ? <YouTubePlayer /> : <ScreenShareViewer />}
          </div>

          {/* Bottom Bar Controls */}
          <footer style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleMuteToggle}
                className={`btn ${micMuted ? "btn-danger" : "btn-secondary"} btn-sm`}
                id="footer-mute"
              >
                {micMuted ? "🎤 Mic Off (Muted)" : "🎤 Mic On"}
              </button>
              {micError && (
                <span style={{ fontSize: "12px", color: "var(--warning)" }}>
                  {micError}
                </span>
              )}
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              TuneTogether Social Audio Sync
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
