"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import api from "@/lib/api";

export default function JoinRoomPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setRoom } = useRoomStore();
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // To handle if password is required after first attempt
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

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
      setRoom(res.data);
      // Navigate to the room page
      router.push(`/room?id=${res.data.room_id}`);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setPasswordRequired(true);
        setError("Password is required for this room.");
      } else {
        setError(err?.response?.data?.detail || "Failed to join room. Please check the code.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) return null;

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

            {(passwordRequired || password) && (
              <div className="fade-in">
                <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                  Room Password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  id="join-room-password"
                />
              </div>
            )}

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
