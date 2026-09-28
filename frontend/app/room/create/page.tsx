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
      let msg = "FAILED TO CREATE ROOM. PLEASE TRY AGAIN.";
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail[0]?.msg || msg;
      } else if (err?.message && !err?.response) {
        msg = "NETWORK ERROR. VERIFY BACKEND SERVER IS RUNNING.";
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
      background: "var(--bg)",
      padding: "24px",
      position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        
        {/* Navigation back */}
        {!createdRoom && (
          <Link
            href="/home"
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: "16px", paddingLeft: 0, display: "inline-flex", gap: "6px" }}
          >
            <span>←</span> BACK TO HOME
          </Link>
        )}

        <div className="card" style={{ padding: "32px 28px" }}>
          {!createdRoom ? (
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
                    CREATE A ROOM
                  </h2>
                  <p style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "2px" }}>
                    SET UP YOUR ROOM DETAILS
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
                    ROOM NAME
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="ENTER ROOM NAME"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                    maxLength={64}
                    autoFocus
                    id="create-room-name"
                  />
                </div>

                <div>
                  <label className="label" style={{ marginBottom: "6px" }}>
                    ROOM PASSWORD (OPTIONAL)
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="LEAVE EMPTY FOR PUBLIC ACCESS"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="create-room-password"
                  />
                </div>

                <div>
                  <label className="label" style={{ marginBottom: "6px" }}>
                    CAPACITY (MAX MEMBERS)
                  </label>
                  <select
                    className="input"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    id="create-room-max-members"
                    style={{ cursor: "pointer" }}
                  >
                    {[2, 4, 6, 8, 12, 16, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} MEMBERS
                      </option>
                    ))}
                  </select>
                </div>

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
                  id="create-room-submit"
                  style={{ width: "100%", marginTop: "6px", padding: "14px" }}
                >
                  {loading ? "CREATING ROOM…" : "CREATE ROOM →"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: "var(--accent-alt)",
                border: "var(--border)",
                padding: "8px 14px",
                display: "inline-block",
                marginBottom: "16px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}>
                ROOM READY
              </div>

              <h2 style={{ fontSize: "24px", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                ROOM CREATED
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, marginBottom: "20px" }}>
                SHARE THIS 5-CHARACTER INVITATION CODE WITH PARTICIPANTS:
              </p>

              {/* Code Box */}
              <div style={{
                background: "var(--ink)",
                color: "var(--accent-alt)",
                border: "var(--border)",
                boxShadow: "var(--shadow-hard)",
                padding: "20px",
                fontSize: "36px",
                fontWeight: 900,
                letterSpacing: "0.25em",
                fontFamily: "var(--font-mono)",
                textIndent: "0.25em",
                marginBottom: "20px",
              }}>
                {createdRoom.invite_code}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                <button onClick={handleCopyCode} className="btn btn-secondary btn-sm">
                  {copiedCode ? "CODE COPIED" : "COPY CODE"}
                </button>
                <button onClick={handleCopyLink} className="btn btn-secondary btn-sm">
                  {copiedLink ? "LINK COPIED" : "COPY INVITE LINK"}
                </button>
              </div>

              <button
                onClick={() => router.push(`/room?id=${createdRoom.room_id}`)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px" }}
                id="create-room-enter"
              >
                ENTER ROOM →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
