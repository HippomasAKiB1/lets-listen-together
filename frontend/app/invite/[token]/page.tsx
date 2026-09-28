"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const token = (resolvedParams.token || "").trim().toUpperCase();

  const { isAuthenticated } = useAuthStore();
  const { setRoom } = useRoomStore();

  const [status, setStatus] = useState<"checking" | "joining" | "password_required" | "joined" | "error">("checking");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [roomDetails, setRoomDetails] = useState<{ roomName?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMessage("No invite code provided.");
      setStatus("error");
      return;
    }

    // Step 1: Check Auth
    if (!isAuthenticated()) {
      const destination = `/invite/${token}`;
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
      return;
    }

    // Step 2: Auto-join immediately
    handleJoinRoom();
  }, [token, isAuthenticated, router]);

  const handleJoinRoom = async (pwd?: string) => {
    setStatus("joining");
    setErrorMessage("");

    try {
      const res = await api.post("/rooms/join", {
        invite_code: token,
        password: pwd || password || null,
      });

      setRoomDetails({ roomName: res.data.room_name });
      setStatus("joined");

      // Save to zustand store
      setRoom({
        roomId: res.data.room_id,
        roomName: res.data.room_name,
        hostId: res.data.host_id,
        inviteCode: res.data.invite_code,
        members: res.data.members || [],
        currentSong: res.data.current_song || {},
      });

      // Navigate to the room immediately
      setTimeout(() => {
        router.push(`/room?id=${res.data.room_id}`);
      }, 700);
    } catch (err: any) {
      const statusCode = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (statusCode === 401 || detail === "Not authenticated") {
        router.push(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
      } else if (statusCode === 403 || (typeof detail === "string" && detail.toLowerCase().includes("password"))) {
        setStatus("password_required");
        setErrorMessage(pwd ? "Incorrect password. Please try again." : "");
      } else if (statusCode === 404) {
        setStatus("error");
        setErrorMessage("Room not found or this invite link has expired.");
      } else if (statusCode === 409) {
        setStatus("error");
        setErrorMessage("This room is currently full and cannot accept more members.");
      } else {
        setStatus("error");
        setErrorMessage(
          typeof detail === "string"
            ? detail
            : err?.message || "Failed to join room. Please check your connection."
        );
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Please enter the room password.");
      return;
    }
    handleJoinRoom(password);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.15) 0%, #08080C 75%)",
      padding: "24px",
      position: "relative",
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "360px",
        height: "360px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      <div className="fade-in" style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 2 }}>
        
        {/* Transparent Brand Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
          }}>
            <Image
              src="/assets/app-logo-trans.png"
              alt="TuneTogether Logo"
              width={76}
              height={76}
              priority
              style={{ objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.45))" }}
            />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            TuneTogether
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Real-Time Shared Listening
          </p>
        </div>

        {/* State Card */}
        <div className="card card-glow" style={{ padding: "36px 30px" }}>
          
          {(status === "checking" || status === "joining") && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: "48px",
                height: "48px",
                border: "3px solid rgba(139, 92, 246, 0.2)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 0.8s linear infinite",
              }} />
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
                {status === "checking" ? "Checking invitation…" : `Joining room ${token}…`}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Connecting you to the synchronized audio session.
              </p>
            </div>
          )}

          {status === "joined" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: "56px",
                height: "56px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                margin: "0 auto 16px",
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "6px" }}>
                You&apos;re in!
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Entering {roomDetails?.roomName ? `"${roomDetails.roomName}"` : "the listening room"}…
              </p>
            </div>
          )}

          {status === "password_required" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "32px" }}>🔒</span>
                <h2 style={{ fontSize: "20px", fontWeight: "700", marginTop: "8px", marginBottom: "6px" }}>
                  Password Protected Room
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  Room <strong style={{ color: "#C4B5FD" }}>{token}</strong> requires a password to enter.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Room Password
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Enter room password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {errorMessage && <p className="error-text">{errorMessage}</p>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "14px", marginTop: "4px" }}
                >
                  Join Room
                </button>
              </form>
            </div>
          )}

          {status === "error" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{
                width: "54px",
                height: "54px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                margin: "0 auto 16px",
              }}>
                ✕
              </div>
              <h2 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "8px" }}>
                Unable to Join Room
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
                {errorMessage || "An unexpected error occurred while processing this invite."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => handleJoinRoom()}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Try Again
                </button>
                <Link href="/home" className="btn btn-ghost" style={{ width: "100%" }}>
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
