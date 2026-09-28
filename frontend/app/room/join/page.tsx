"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import api from "@/lib/api";

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { setRoom } = useRoomStore();
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // To handle if password is required after first attempt
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const codeParam = searchParams.get("code");
    if (!isAuthenticated()) {
      const target = codeParam ? `/room/join?code=${codeParam.trim().toUpperCase()}` : "/room/join";
      router.push(`/?redirect=${encodeURIComponent(target)}`);
      return;
    }
    if (codeParam) {
      setInviteCode(codeParam.trim().toUpperCase());
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/rooms/join", {
        invite_code: inviteCode.trim().toUpperCase(),
        password: password || null,
      });
      // Store room details in zustand
      setRoom({
        roomId: res.data.room_id,
        roomName: res.data.room_name,
        hostId: res.data.host_id,
        inviteCode: res.data.invite_code,
        members: res.data.members || [],
        currentSong: res.data.current_song || {},
      });
      // Navigate to the room page
      router.push(`/room?id=${res.data.room_id}`);
    } catch (err: any) {
      console.error("Join room failed:", err, err?.response?.data || err?.message);
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 401 || detail === "Not authenticated") {
        setError("Session expired or not authenticated. Please log in again.");
      } else if (err?.response?.status === 403 || (typeof detail === "string" && detail.toLowerCase().includes("password"))) {
        setPasswordRequired(true);
        setError("Password is required or incorrect for this room.");
      } else if (err?.response?.status === 404) {
        setError("Room not found. Please check the 5-character invite code.");
      } else if (err?.response?.status === 409) {
        setError("Room is currently full.");
      } else {
        let msg = "Failed to join room. Please check the code.";
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          msg = detail[0]?.msg || msg;
        } else if (err?.message && !err?.response) {
          msg = `Network or CORS error (${err.message}). Verify backend is reachable.`;
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.1) 0%, #0F0F0F 85%)",
      padding: "24px",
    }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Navigation back */}
        <button
          onClick={() => router.push("/home")}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: "16px", paddingLeft: 0 }}
        >
          ← Back to Home
        </button>

        <div className="card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
            Join a Room
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
            Enter the 5-character invite code below.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                Invite Code
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g., K4L9P"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={5}
                required
                style={{ textTransform: "uppercase", fontSize: "18px", letterSpacing: "0.1em", fontWeight: "700", textAlign: "center" }}
                id="join-room-invite-code"
              />
            </div>

            <div>
              <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                Room Password <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <input
                className="input"
                type="password"
                placeholder="Enter password if room is protected"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="join-room-password"
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="join-room-submit"
              style={{ width: "100%", marginTop: "8px", padding: "14px" }}
            >
              {loading ? "Joining Room…" : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0F0F0F" }} />}>
      <JoinRoomContent />
    </Suspense>
  );
}

