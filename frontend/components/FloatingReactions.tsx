"use client";

import { useRoomStore } from "@/store/roomStore";

export default function FloatingReactions() {
  const { reactions } = useRoomStore();

  if (!reactions || reactions.length === 0) return null;

  return (
    <div style={{
      position: "absolute",
      right: "24px",
      bottom: "32px",
      pointerEvents: "none",
      zIndex: 25,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      alignItems: "flex-end",
    }}>
      {reactions.map((r) => (
        <div
          key={r.id}
          style={{
            background: "rgba(22, 22, 22, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            padding: "6px 14px",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "reactionFloat 3.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}
        >
          <span style={{ fontSize: "22px", lineHeight: 1 }}>{r.emoji}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {r.username}
          </span>
        </div>
      ))}
    </div>
  );
}
