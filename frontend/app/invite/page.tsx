"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";

function InviteQueryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") || searchParams.get("token") || "").trim().toUpperCase();

  const { isAuthenticated } = useAuthStore();
  const { setRoom } = useRoomStore();

  const [status, setStatus] = useState<"checking" | "joining" | "password_required" | "joined" | "error">("checking");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [roomDetails, setRoomDetails] = useState<{ roomName?: string } | null>(null);

  useEffect(() => {
    if (!code) {
      router.push("/room/join");
      return;
    }

    if (!isAuthenticated()) {
      const destination = `/invite?code=${code}`;
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
      return;
    }

    handleJoinRoom();
  }, [code, isAuthenticated, router]);

  const handleJoinRoom = async (pwd?: string) => {
    setStatus("joining");
    setErrorMessage("");

    try {
      const res = await api.post("/rooms/join", {
        invite_code: code,
        password: pwd || password || null,
      });

      setRoomDetails({ roomName: res.data.room_name });
      setStatus("joined");

      setRoom({
        roomId: res.data.room_id,
        roomName: res.data.room_name,
        hostId: res.data.host_id,
        inviteCode: res.data.invite_code,
        members: res.data.members || [],
        currentSong: res.data.current_song || {},
      });

      setTimeout(() => {
        router.push(`/room?id=${res.data.room_id}`);
      }, 700);
    } catch (err: any) {
      const statusCode = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (statusCode === 401 || detail === "Not authenticated") {
        router.push(`/login?redirect=${encodeURIComponent(`/invite?code=${code}`)}`);
      } else if (statusCode === 403 || (typeof detail === "string" && detail.toLowerCase().includes("password"))) {
        setStatus("password_required");
        setErrorMessage(pwd ? "INCORRECT PASSWORD. TRY AGAIN." : "");
      } else if (statusCode === 404) {
        setStatus("error");
        setErrorMessage("ROOM NOT FOUND OR THIS INVITE LINK HAS EXPIRED.");
      } else if (statusCode === 409) {
        setStatus("error");
        setErrorMessage("THIS ROOM IS CURRENTLY FULL (MAX CAPACITY REACHED).");
      } else {
        setStatus("error");
        setErrorMessage(
          typeof detail === "string"
            ? detail.toUpperCase()
            : err?.message?.toUpperCase() || "FAILED TO JOIN ROOM. VERIFY CONNECTION."
        );
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("ENTER THE ROOM PASSWORD.");
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
      background: "var(--bg)",
      padding: "24px",
      position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--ink)",
            padding: "12px 24px",
            marginBottom: "16px",
          }}>
            <Image
              src="/assets/app-logo-trans.png"
              alt="TuneTogether"
              width={160}
              height={56}
              priority
              style={{ height: "56px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.03em" }}>
            TUNETOGETHER
          </h1>
          <p style={{
            fontSize: "12px",
            color: "var(--muted)",
            marginTop: "4px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            ROOM INVITATION
          </p>
        </div>

        {/* State Card */}
        <div className="card" style={{ padding: "32px 28px" }}>
          
          {(status === "checking" || status === "joining") && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
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
                JOINING ROOM...
                <span className="cursor-blink">_</span>
              </div>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 700 }}>
                CONNECTING TO SESSION…
              </p>
            </div>
          )}

          {status === "joined" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                background: "var(--accent-alt)",
                border: "var(--border)",
                padding: "8px 12px",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                display: "inline-block",
                marginBottom: "16px",
              }}>
                INVITATION ACCEPTED
              </div>
              <h2 style={{ fontSize: "22px", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                ENTERING ROOM NOW
              </h2>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 700 }}>
                LOADING SESSION: {roomDetails?.roomName ? `"${roomDetails.roomName}"` : code}…
              </p>
            </div>
          )}

          {status === "password_required" && (
            <div>
              <div style={{
                borderBottom: "var(--border)",
                paddingBottom: "12px",
                marginBottom: "20px",
              }}>
                <h2 style={{ fontSize: "18px", letterSpacing: "-0.02em" }}>
                  PASSWORD REQUIRED
                </h2>
                <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 700, marginTop: "2px" }}>
                  ROOM {code} IS PASSWORD PROTECTED
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                    autoFocus
                    required
                  />
                </div>

                {errorMessage && (
                  <div style={{
                    background: "#FFE5E5",
                    border: "2px solid var(--error)",
                    padding: "8px 12px",
                    color: "var(--error)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}>
                    ERROR: {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "14px", marginTop: "4px" }}
                >
                  ENTER ROOM →
                </button>
              </form>
            </div>
          )}

          {status === "error" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{
                background: "#FFE5E5",
                border: "2px solid var(--error)",
                padding: "16px",
                color: "var(--error)",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                marginBottom: "20px",
                textAlign: "left",
              }}>
                {errorMessage || "UNEXPECTED ERROR OCCURRED."}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => handleJoinRoom()}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  RETRY JOIN →
                </button>
                <Link href="/home" className="btn btn-outline" style={{ width: "100%" }}>
                  BACK TO HOME
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InviteQueryPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <InviteQueryContent />
    </Suspense>
  );
}
