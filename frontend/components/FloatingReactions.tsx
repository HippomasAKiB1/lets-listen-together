"use client";

import { useRoomStore } from "@/store/roomStore";

export default function FloatingReactions() {
  const { reactions } = useRoomStore();

  if (!reactions || reactions.length === 0) return null;

  return (
    <div style={{
      position: "absolute",
      right: "20px",
      bottom: "24px",
      pointerEvents: "none",
      zIndex: 25,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "flex-end",
    }}>
      {reactions.map((r) => (
        <div
          key={r.id}
          style={{
            background: "var(--accent-alt)",
            color: "var(--ink)",
            border: "var(--border)",
            boxShadow: "var(--shadow-hard-sm)",
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            animation: "reactionFloat 3s ease-out forwards",
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>{r.emoji}</span>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {r.username}
          </span>
        </div>
      ))}
    </div>
  );
}
