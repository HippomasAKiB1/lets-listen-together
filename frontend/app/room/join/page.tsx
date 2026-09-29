"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
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

  const executeJoin = useCallback(async (codeToJoin: string, pwd?: string) => {
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
        setError("PASSWORD REQUIRED OR INCORRECT FOR THIS ROOM.");
      } else if (statusCode === 404) {
        setError("ROOM NOT FOUND. CHECK THE 5-CHARACTER INVITE CODE.");
      } else if (statusCode === 409) {
        setError("ROOM HAS REACHED MAXIMUM MEMBER CAPACITY.");
      } else {
        setError(
          typeof detail === "string"
            ? detail.toUpperCase()
            : err?.message?.toUpperCase() || "FAILED TO JOIN ROOM. VERIFY BACKEND SERVER."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [password, setRoom, router]);

  useEffect(() => {
    setMounted(true);
    const targetUrl = codeParam ? `/room/join?code=${codeParam}` : "/room/join";

    if (!isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }

    if (codeParam) {
      setInviteCode(codeParam);
      executeJoin(codeParam, "");
    }
  }, [isAuthenticated, router, codeParam, executeJoin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("ENTER A VALID 5-CHARACTER INVITE CODE.");
      return;
    }
    executeJoin(inviteCode, password);
  };

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        paddingTop: "calc(20px + var(--safe-top))",
        paddingBottom: "calc(24px + var(--safe-bottom))",
        paddingLeft: "calc(16px + var(--safe-left))",
        paddingRight: "calc(16px + var(--safe-right))",
        position: "relative",
      }}
      className="flex flex-col items-center justify-start md:justify-center"
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Navigation back */}
        <Link
          href="/home"
          className="btn btn-ghost"
          style={{
            marginBottom: "16px",
            padding: "8px 12px",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          <span>←</span> BACK TO HOME
        </Link>

        <div className="card" style={{ padding: "clamp(20px, 5vw, 32px)" }}>
          {autoJoining && loading ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
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
                JOINING ROOM...<span className="cursor-blink">_</span>
              </div>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 700 }}>
                CONNECTING TO ROOM…
              </p>
            </div>
          ) : (
            <>
              {/* Header inside card */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "var(--border)",
                paddingBottom: "12px",
                marginBottom: "24px",
              }}>
                <div>
                  <h2 style={{ fontSize: "20px", letterSpacing: "-0.02em" }}>
                    JOIN A ROOM
                  </h2>
                  <p style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "2px" }}>
                    ENTER 5-CHARACTER CODE
                  </p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Image
                    src="/assets/app-logo-trans.png"
                    alt="Tune Together"
                    width={120}
                    height={48}
                    priority
                    className="logo-contrast-light"
                    style={{ height: "48px", width: "auto", objectFit: "contain" }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label className="label" style={{ marginBottom: "6px" }}>
                    INVITE CODE
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="E.G. K4L9P"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    required
                    style={{
                      fontSize: "24px",
                      letterSpacing: "0.2em",
                      fontWeight: 900,
                      textAlign: "center",
                      fontFamily: "var(--font-mono)",
                      background: "var(--bg)",
                      minHeight: "48px",
                    }}
                    id="join-room-invite-code"
                  />
                </div>

                {(passwordRequired || password) && (
                  <div>
                    <label className="label" style={{ marginBottom: "6px" }}>
                      ROOM PASSWORD
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="ENTER ROOM PASSWORD"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required={passwordRequired}
                      id="join-room-password"
                      autoFocus={passwordRequired}
                      style={{ minHeight: "44px" }}
                    />
                  </div>
                )}

                {error && (
                  <div style={{
                    background: "#FFE5E5",
                    border: "2px solid var(--error)",
                    padding: "8px 12px",
                    color: "var(--error)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}>
                    ERROR: {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  id="join-room-submit"
                  style={{ width: "100%", marginTop: "6px", padding: "14px", minHeight: "48px" }}
                >
                  {loading ? "JOINING ROOM…" : "JOIN ROOM →"}
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
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <JoinRoomContent />
    </Suspense>
  );
}
