"use client";

import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getSocketInstance } from "@/lib/socket";
import { startScreenShare, stopScreenShare } from "@/lib/webrtc";
import { useState } from "react";

export default function ModeSelector() {
  const { currentSong, hostId } = useRoomStore();
  const { userId } = useAuthStore();
  const isHost = userId === hostId;
  const isScreenshare = currentSong.mode === "screenshare";
  
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  const handleToggleMode = async (mode: "youtube" | "screenshare") => {
    if (!isHost) return;
    const socket = getSocketInstance();
    if (!socket) return;

    setError("");

    if (mode === "screenshare") {
      try {
        setSharing(true);
        await startScreenShare(socket, useRoomStore.getState().roomId!);
      } catch (err: any) {
        console.error("Screenshare error:", err);
        setError("Screen share cancelled or failed.");
        setSharing(false);
      }
    } else {
      if (sharing) {
        stopScreenShare(socket);
        setSharing(false);
      } else {
        socket.emit("screenshare_ended", {});
      }
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      borderBottom: "1px solid var(--border)",
      background: "rgba(22, 33, 62, 0.4)",
    }}>
      <div style={{
        display: "flex",
        background: "var(--bg-secondary)",
        borderRadius: "20px",
        padding: "4px",
        border: "1px solid var(--border)",
        gap: "4px",
      }}>
        <button
          onClick={() => handleToggleMode("youtube")}
          className={`btn btn-sm ${!isScreenshare ? "btn-primary" : "btn-ghost"}`}
          style={{ borderRadius: "16px", padding: "6px 16px", fontSize: "13px" }}
          disabled={isHost ? false : isScreenshare}
          id="mode-youtube"
        >
          🎵 YouTube Sync
        </button>
        <button
          onClick={() => handleToggleMode("screenshare")}
          className={`btn btn-sm ${isScreenshare ? "btn-danger" : "btn-ghost"}`}
          style={{ borderRadius: "16px", padding: "6px 16px", fontSize: "13px" }}
          disabled={isHost ? false : !isScreenshare}
          id="mode-screenshare"
        >
          🖥️ Screenshare Mode
        </button>
      </div>
      
      {error && (
        <span style={{ fontSize: "12px", color: "var(--error)" }}>
          {error}
        </span>
      )}
      
      {!isHost && (
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
          Mode controlled by Host
        </span>
      )}
    </div>
  );
}
