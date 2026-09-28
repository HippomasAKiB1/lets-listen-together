"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/roomStore";
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
    if (confirm("TRANSFER HOST PERMISSIONS TO THIS MEMBER?")) {
      const socket = getSocketInstance();
      socket?.emit("transfer_host", { new_host_id: targetUserId });
      setActiveMenuUserId(null);
    }
  };

  const handleKickMember = (targetUserId: string, username: string) => {
    if (!isCurrentHost) return;
    if (confirm(`REMOVE ${username.toUpperCase()} FROM THE ROOM?`)) {
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
      borderRight: "var(--border)",
      background: "var(--surface)",
      width: "260px",
      flexShrink: 0,
      color: "var(--ink)",
    }}>
      {/* Header Bar */}
      <div style={{
        padding: "12px 16px",
        background: "var(--ink)",
        color: "var(--ink-light)",
        borderBottom: "var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h3 style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.06em" }}>
          MEMBERS [{members.length}]
        </h3>
        <span style={{ fontSize: "10px", color: "var(--accent-alt)", fontFamily: "var(--font-mono)" }}>
          MESH ACTIVE
        </span>
      </div>

      {/* Members Table-Style Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
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
                background: isSpeaking ? "var(--accent-alt)" : "transparent",
                borderBottom: "var(--border-thin)",
                transition: "background-color 80ms ease-out",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                {/* Square Avatar with Initials */}
                <div style={{
                  width: "26px",
                  height: "26px",
                  background: isMemberHost ? "var(--accent)" : "var(--ink)",
                  color: "#FFFFFF",
                  border: "1px solid var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 900,
                  flexShrink: 0,
                }}>
                  {member.username.slice(0, 2).toUpperCase()}
                </div>

                {/* Name and Tags */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {member.username} {isSelf && "[YOU]"}
                  </span>

                  {isMemberHost && (
                    <span style={{
                      fontSize: "9px",
                      background: "var(--ink)",
                      color: "var(--accent-alt)",
                      padding: "1px 4px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      width: "fit-content",
                      marginTop: "2px",
                    }}>
                      ROOM HOST
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: Mic Status & Speaking */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  title={isMuted ? "MIC MUTED" : "MIC ACTIVE"}
                  style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    background: isMuted ? "#E8E4D9" : "var(--accent-alt)",
                    border: "1px solid var(--ink)",
                    padding: "2px 4px",
                  }}
                >
                  {isMuted ? "MUTE" : "LIVE"}
                </span>

                {isSpeaking && <SpeakingIndicator />}

                {/* Host Moderation Menu */}
                {isCurrentHost && !isMemberHost && (
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setActiveMenuUserId(isMenuOpen ? null : member.user_id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "2px 4px", fontSize: "12px", height: "auto" }}
                      title="MEMBER CONTROLS"
                    >
                      ⋮
                    </button>

                    {isMenuOpen && (
                      <div style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: "2px",
                        background: "var(--surface)",
                        border: "var(--border)",
                        boxShadow: "var(--shadow-hard-sm)",
                        padding: "2px",
                        zIndex: 50,
                        minWidth: "140px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}>
                        <button
                          onClick={() => handleTransferHost(member.user_id)}
                          className="btn btn-ghost btn-sm"
                          style={{ justifyContent: "flex-start", fontSize: "11px", padding: "6px 8px" }}
                        >
                          MAKE HOST [👑]
                        </button>
                        <button
                          onClick={() => handleKickMember(member.user_id, member.username)}
                          className="btn btn-ghost btn-sm"
                          style={{ justifyContent: "flex-start", fontSize: "11px", padding: "6px 8px", color: "var(--error)" }}
                        >
                          REMOVE [✕]
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
  );
}
