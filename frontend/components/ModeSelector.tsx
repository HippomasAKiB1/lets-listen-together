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
        setError("SCREENSHARE CANCELLED OR FAILED.");
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
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 16px",
      borderBottom: "var(--border-thin)",
      background: "var(--surface)",
      color: "var(--ink)",
    }}>
      <div style={{
        display: "flex",
        background: "var(--bg)",
        border: "var(--border-thin)",
        padding: "2px",
        gap: "2px",
      }}>
        <button
          onClick={() => handleToggleMode("youtube")}
          className={`btn btn-sm ${!isScreenshare ? "btn-primary" : "btn-ghost"}`}
          style={{ padding: "4px 12px", fontSize: "11px" }}
          disabled={isHost ? false : isScreenshare}
          id="mode-youtube"
        >
          YOUTUBE SYNC
        </button>
        <button
          onClick={() => handleToggleMode("screenshare")}
          className={`btn btn-sm ${isScreenshare ? "btn-danger" : "btn-ghost"}`}
          style={{ padding: "4px 12px", fontSize: "11px" }}
          disabled={isHost ? false : !isScreenshare}
          id="mode-screenshare"
        >
          SCREENSHARE
        </button>
      </div>
      
      {error ? (
        <span style={{ fontSize: "11px", color: "var(--error)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {error}
        </span>
      ) : (
        <span style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {isHost ? "HOST CONTROLS" : "CONTROLLED BY HOST"}
        </span>
      )}
    </div>
  );
}
