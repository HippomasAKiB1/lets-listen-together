"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getScreenshareStream } from "@/lib/webrtc";

export default function ScreenShareViewer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { currentSong, hostId } = useRoomStore();
  const { userId } = useAuthStore();
  const isHost = userId === hostId;

  useEffect(() => {
    const existing = getScreenshareStream();
    if (existing) {
      setStream(existing);
    }

    const handleStream = (e: Event) => {
      const customEvent = e as CustomEvent<{ stream: MediaStream; sid: string }>;
      setStream(customEvent.detail.stream);
    };

    const handleEnded = () => {
      setStream(null);
    };

    window.addEventListener("screenshare-stream", handleStream);
    window.addEventListener("screenshare-ended", handleEnded);

    return () => {
      window.removeEventListener("screenshare-stream", handleStream);
      window.removeEventListener("screenshare-ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.warn("Video play error:", err));
    }
  }, [stream]);

  if (!stream && currentSong.mode === "screenshare") {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px",
        color: "var(--muted)",
        gap: "16px",
        background: "#000000",
      }}>
        <div style={{
          background: "var(--surface)",
          border: "var(--border)",
          padding: "24px",
          textAlign: "center",
          maxWidth: "380px",
          boxShadow: "var(--shadow-hard)",
        }}>
          <h3 style={{ color: "var(--ink)", marginBottom: "6px", fontSize: "14px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            WAITING FOR SCREEN SHARE
          </h3>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            THE HOST HAS SWITCHED TO SCREENSHARE MODE. DISPLAY WILL APPEAR ONCE SHARING STARTS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#000000",
      position: "relative",
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isHost}
        style={{
          width: "100%",
          height: "100%",
          maxHeight: "80vh",
          objectFit: "contain",
        }}
      />
      <div style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        background: "var(--ink)",
        border: "1px solid #FFFFFF",
        padding: "6px 12px",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#FFFFFF",
        pointerEvents: "none",
      }}>
        <span style={{ width: "8px", height: "8px", background: "var(--error)", display: "inline-block" }} />
        LIVE SCREENSHARE
      </div>
    </div>
  );
}
