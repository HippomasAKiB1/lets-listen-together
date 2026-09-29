"use client";

import { useRoomStore } from "@/store/roomStore";
import { REACTION_MAP } from "@/lib/reactions";

export default function FloatingReactions() {
  const { reactions } = useRoomStore();

  if (!reactions || reactions.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: "20px",
        bottom: "24px",
        pointerEvents: "none",
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-end",
      }}
    >
      {reactions.map((r) => {
        const item = REACTION_MAP[r.emoji];
        return (
          <div
            key={r.id}
            className="floating-reaction-badge"
            style={{
              background: "var(--accent-alt)",
              color: "var(--ink)",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard-sm)",
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "reactionFloat 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
            }}
          >
            {item ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.src}
                alt={item.label}
                style={{
                  width: "22px",
                  height: "22px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : r.emoji.startsWith("/") || r.emoji.startsWith("http") ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={r.emoji}
                alt="Reaction"
                style={{
                  width: "22px",
                  height: "22px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <span style={{ fontSize: "18px", lineHeight: 1 }}>{r.emoji}</span>
            )}
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              {r.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}

