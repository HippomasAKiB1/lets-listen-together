"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import api from "@/lib/api";

export default function CreateRoomPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setRoom } = useRoomStore();
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // After creation
  const [createdRoom, setCreatedRoom] = useState<{ room_id: string; invite_code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login?redirect=/room/create");
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
      setRoom({
        roomId: res.data.room_id,
        roomName: res.data.room_name,
        hostId: res.data.host_id,
        inviteCode: res.data.invite_code,
        members: [],
        currentSong: {},
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let msg = "Failed to create room. Please try again.";
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail[0]?.msg || msg;
      } else if (err?.message && !err?.response) {
        msg = "Network error. Please make sure the backend server is running.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (createdRoom) {
      const link = `${window.location.origin}/invite/${createdRoom.invite_code}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
      <div className="fade-in" style={{ width: "100%", maxWidth: "460px", position: "relative", zIndex: 2 }}>
        
        {/* Navigation back */}
        {!createdRoom && (
          <Link
            href="/home"
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: "16px", paddingLeft: 0, display: "inline-flex", gap: "6px" }}
          >
            <span>←</span> Back to Dashboard
          </Link>
        )}

        <div className="card card-glow" style={{ padding: "34px 30px" }}>
          {!createdRoom ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                <Image
                  src="/assets/app-logo-trans.png"
                  alt="TuneTogether Logo"
                  width={38}
                  height={38}
                  style={{ objectFit: "contain" }}
                />
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.01em" }}>
                    Create a Room
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    Set up your synchronized listening room.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Room Name
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Late Night Lo-Fi Sanctuary"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                    maxLength={64}
                    autoFocus
                    id="create-room-name"
                  />
                </div>

                <div>
                  <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                    Room Password <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "none" }}>(Optional)</span>
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
                  style={{ width: "100%", marginTop: "6px", padding: "14px" }}
                >
                  {loading ? "Creating Room…" : "Create Room"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                margin: "0 auto 16px",
              }}>
                🎉
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>
                Room Created!
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "22px" }}>
                Share your invite link or 5-letter code with friends:
              </p>

              <div style={{
                background: "rgba(10, 10, 14, 0.8)",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                borderRadius: "14px",
                padding: "18px",
                fontSize: "32px",
                fontWeight: "800",
                letterSpacing: "0.2em",
                color: "#C4B5FD",
                fontFamily: "monospace",
                textIndent: "0.2em",
                marginBottom: "16px",
                boxShadow: "0 0 25px rgba(139, 92, 246, 0.2)",
              }}>
                {createdRoom.invite_code}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
                <button onClick={handleCopyCode} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  {copiedCode ? "✓ Code Copied" : "Copy Code"}
                </button>
                <button onClick={handleCopyLink} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  {copiedLink ? "✓ Link Copied!" : "🔗 Copy Invite Link"}
                </button>
              </div>

              <button
                onClick={() => router.push(`/room?id=${createdRoom.room_id}`)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px" }}
                id="create-room-enter"
              >
                Enter Room →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
