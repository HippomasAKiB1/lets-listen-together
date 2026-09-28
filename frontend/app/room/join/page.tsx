"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import api from "@/lib/api";

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { setRoom } = useRoomStore();

  const codeParam = (searchParams.get("code") || "").trim().toUpperCase();
  const [inviteCode, setInviteCode] = useState(codeParam);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoJoining, setAutoJoining] = useState(!!codeParam);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const targetUrl = codeParam ? `/room/join?code=${codeParam}` : "/room/join";

    if (!isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }

    if (codeParam) {
      setInviteCode(codeParam);
      // Auto join if code was provided in URL
      executeJoin(codeParam, "");
    }
  }, [isAuthenticated, router, searchParams]);

  const executeJoin = async (codeToJoin: string, pwd?: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/rooms/join", {
        invite_code: codeToJoin.trim().toUpperCase(),
        password: pwd || password || null,
      });

      setRoom({
        roomId: res.data.room_id,
        roomName: res.data.room_name,
        hostId: res.data.host_id,
        inviteCode: res.data.invite_code,
        members: res.data.members || [],
        currentSong: res.data.current_song || {},
      });

      router.push(`/room?id=${res.data.room_id}`);
    } catch (err: any) {
      setAutoJoining(false);
      const statusCode = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (statusCode === 401 || detail === "Not authenticated") {
        const dest = codeToJoin ? `/room/join?code=${codeToJoin}` : "/room/join";
        router.push(`/login?redirect=${encodeURIComponent(dest)}`);
      } else if (statusCode === 403 || (typeof detail === "string" && detail.toLowerCase().includes("password"))) {
        setPasswordRequired(true);
        setError("This room requires a password to enter.");
      } else if (statusCode === 404) {
        setError("Room not found. Please check the 5-character invite code.");
      } else if (statusCode === 409) {
        setError("This room has reached maximum capacity.");
      } else {
        setError(
          typeof detail === "string"
            ? detail
            : err?.message || "Failed to join room. Verify backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("Please enter a valid invite code.");
      return;
    }
    executeJoin(inviteCode, password);
  };

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 50% 15%, rgba(139, 92, 246, 0.14) 0%, #08080C 80%)",
      padding: "24px",
      position: "relative",
    }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 2 }}>
        
        {/* Navigation back */}
        <Link
          href="/home"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: "16px", paddingLeft: 0, display: "inline-flex", gap: "6px" }}
        >
          <span>←</span> Back to Dashboard
        </Link>

        <div className="card card-glow" style={{ padding: "34px 28px" }}>
          {autoJoining && loading ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: "44px",
                height: "44px",
                border: "3px solid rgba(139, 92, 246, 0.2)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                margin: "0 auto 18px",
                animation: "spin 0.8s linear infinite",
              }} />
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <h2 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "6px" }}>
                Entering Room {codeParam}…
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Verifying your invitation and synchronizing audio.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <Image
                  src="/assets/app-logo-trans.png"
                  alt="TuneTogether Logo"
                  width={38}
                  height={38}
                  style={{ objectFit: "contain" }}
                />
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.01em" }}>
                    Join a Room
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    Enter the 5-character room code.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Invite Code
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. K4L9P"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    required
                    style={{
                      textTransform: "uppercase",
                      fontSize: "20px",
                      letterSpacing: "0.15em",
                      fontWeight: "700",
                      textAlign: "center",
                      fontFamily: "monospace",
                    }}
                    id="join-room-invite-code"
                  />
                </div>

                {(passwordRequired || password) && (
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
                      required={passwordRequired}
                      id="join-room-password"
                      autoFocus={passwordRequired}
                    />
                  </div>
                )}

                {error && <p className="error-text">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  id="join-room-submit"
                  style={{ width: "100%", marginTop: "6px", padding: "14px" }}
                >
                  {loading ? "Joining…" : "Join Room"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#08080C" }} />}>
      <JoinRoomContent />
    </Suspense>
  );
}
