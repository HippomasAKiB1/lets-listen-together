"use client";

import { useState } from "react";
import { useRoomStore, Member } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getSocketInstance } from "@/lib/socket";
import SpeakingIndicator from "./SpeakingIndicator";

export default function MemberList() {
  const { members, hostId } = useRoomStore();
  const { userId } = useAuthStore();
  const isCurrentHost = userId === hostId;

  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const handleTransferHost = (targetUserId: string) => {
    if (!isCurrentHost) return;
    if (confirm("Are you sure you want to transfer host permissions to this member?")) {
      const socket = getSocketInstance();
      socket?.emit("transfer_host", { new_host_id: targetUserId });
      setActiveMenuUserId(null);
    }
  };

  const handleKickMember = (targetUserId: string, username: string) => {
    if (!isCurrentHost) return;
    if (confirm(`Remove ${username} from the room?`)) {
      const socket = getSocketInstance();
      socket?.emit("kick_member", { user_id: targetUserId });
      setActiveMenuUserId(null);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      borderRight: "1px solid var(--border)",
      background: "var(--bg-secondary)",
      width: "280px",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <h3 className="label">Members ({members.length})</h3>
      </div>

      {/* Members Scroll area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {members.map((member) => {
            const isMemberHost = member.user_id === hostId;
            const isSpeaking = member.is_speaking;
            const isMuted = member.is_muted ?? true;
            const isSelf = member.user_id === userId;
            const isMenuOpen = activeMenuUserId === member.user_id;

            return (
              <div
                key={member.user_id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: isSpeaking ? "rgba(124, 58, 237, 0.1)" : "var(--bg-card)",
                  border: isSpeaking
                    ? "1px solid rgba(124, 58, 237, 0.3)"
                    : "1px solid var(--border)",
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  {/* Status Dot */}
                  <span className="online-dot" />

                  {/* Name and Tags */}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: isSpeaking ? "#fff" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {member.username} {isSelf && "(You)"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      {isMemberHost && (
                        <span style={{
                          fontSize: "10px",
                          color: "#A78BFA",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          👑 Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Mic Status & Speaking waveform */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Mic Status Icon */}
                  <span
                    title={isMuted ? "Microphone Muted" : "Microphone Active"}
                    style={{
                      fontSize: "14px",
                      opacity: isMuted ? 0.45 : 1,
                      filter: isMuted ? "grayscale(100%)" : "none",
                    }}
                  >
                    {isMuted ? "🔇" : "🎙️"}
                  </span>

                  {/* Speaking Waveform */}
                  {isSpeaking && <SpeakingIndicator />}

                  {/* Host Moderation Menu (Only shown to Host on other members) */}
                  {isCurrentHost && !isMemberHost && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setActiveMenuUserId(isMenuOpen ? null : member.user_id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "2px 6px", fontSize: "14px", height: "auto", color: "var(--text-secondary)" }}
                        title="Member Options"
                      >
                        ⋮
                      </button>

                      {isMenuOpen && (
                        <div style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          marginTop: "4px",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                          padding: "4px",
                          zIndex: 50,
                          minWidth: "140px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}>
                          <button
                            onClick={() => handleTransferHost(member.user_id)}
                            className="btn btn-ghost btn-sm"
                            style={{ justifyContent: "flex-start", fontSize: "12px", padding: "6px 8px" }}
                          >
                            👑 Make Host
                          </button>
                          <button
                            onClick={() => handleKickMember(member.user_id, member.username)}
                            className="btn btn-ghost btn-sm"
                            style={{ justifyContent: "flex-start", fontSize: "12px", padding: "6px 8px", color: "var(--error)" }}
                          >
                            🚫 Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
