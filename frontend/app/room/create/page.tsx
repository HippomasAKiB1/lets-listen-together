"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function CreateRoomPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // After creation
  const [createdRoom, setCreatedRoom] = useState<{ room_id: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
      const res = await api.post("/rooms/create", {
        room_name: roomName,
        password: password || null,
        max_members: Number(maxMembers),
      });
      setCreatedRoom(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        {!createdRoom && (
          <button
            onClick={() => router.push("/home")}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: "16px", paddingLeft: 0 }}
          >
            ← Back to Home
          </button>
        )}

        <div className="card" style={{ padding: "32px" }}>
          {!createdRoom ? (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
                Create a Room
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                Configure your room details below.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Room Name
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g., Late Night Vibes"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                    maxLength={64}
                    id="create-room-name"
                  />
                </div>

                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Room Password (optional)
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Leave empty for public access"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="create-room-password"
                  />
                </div>

                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Max Members
                  </label>
                  <select
                    className="input"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    id="create-room-max-members"
                    style={{ appearance: "none" }}
                  >
                    {[2, 4, 6, 8, 12, 16, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} Members
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="error-text">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  id="create-room-submit"
                  style={{ width: "100%", marginTop: "8px", padding: "14px" }}
                >
                  {loading ? "Creating Room…" : "Create Room"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎉</div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
                Room Created!
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                Share this invite code with your friends.
              </p>

              <div style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
                fontSize: "32px",
                fontWeight: "800",
                letterSpacing: "0.2em",
                color: "#A78BFA",
                textIndent: "0.2em", // Center offset correction for letter spacing
                marginBottom: "16px",
              }}>
                {createdRoom.invite_code}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "24px" }}>
                <button onClick={handleCopy} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  {copied ? "Copied! ✓" : "Copy Code"}
                </button>
              </div>

              <button
                onClick={() => router.push(`/room?id=${createdRoom.room_id}`)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px" }}
                id="create-room-enter"
              >
                Enter Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
