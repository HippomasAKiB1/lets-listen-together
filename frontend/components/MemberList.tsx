"use client";

import { useRoomStore } from "@/store/roomStore";
import SpeakingIndicator from "./SpeakingIndicator";

export default function MemberList() {
  const { members, hostId } = useRoomStore();

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
            const isHost = member.user_id === hostId;
            const isSpeaking = member.is_speaking;

            return (
              <div
                key={member.user_id}
                style={{
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  {/* Status Indicator */}
                  <span className="online-dot" />

                  {/* Name and Tag */}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: isSpeaking ? "#fff" : "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {member.username}
                    </span>
                    {isHost && (
                      <span style={{
                        fontSize: "10px",
                        color: "#A78BFA",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginTop: "2px",
                      }}>
                        Host
                      </span>
                    )}
                  </div>
                </div>

                {/* Speaking Waveform */}
                {isSpeaking && <SpeakingIndicator />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
