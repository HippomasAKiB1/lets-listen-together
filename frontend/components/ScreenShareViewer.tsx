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
    // Check if a stream is already active (e.g. host started sharing before viewer mounted, or remote stream stored)
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
        color: "var(--text-muted)",
        gap: "16px",
      }}>
        <span style={{ fontSize: "48px" }}>📺</span>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "4px", fontSize: "16px", fontWeight: "600" }}>
            Waiting for Screen Share
          </h3>
          <p style={{ fontSize: "13px" }}>
            The host started screensharing mode. Once the stream starts, it will display here.
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
      background: "#000",
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
        bottom: "20px",
        left: "20px",
        background: "rgba(15, 15, 15, 0.85)",
        border: "1px solid var(--border)",
        padding: "8px 14px",
        borderRadius: "8px",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#fff",
        pointerEvents: "none",
      }}>
        <span style={{ width: "8px", height: "8px", background: "var(--error)", borderRadius: "50%", display: "inline-block" }} />
        LIVE SCREENSHARE
      </div>
    </div>
  );
}
