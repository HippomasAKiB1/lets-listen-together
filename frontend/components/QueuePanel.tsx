"use client";

import { useState } from "react";
import { useRoomStore, QueueItem } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getSocketInstance } from "@/lib/socket";

export default function QueuePanel() {
  const { queue, hostId } = useRoomStore();
  const { userId } = useAuthStore();
  const isHost = userId === hostId;
  const [isOpen, setIsOpen] = useState(false);

  const handlePlayNow = (item: QueueItem, index: number) => {
    if (!isHost) return;
    const socket = getSocketInstance();
    if (!socket) return;

    // Remove from queue and play immediately
    socket.emit("remove_from_queue", { index });
    socket.emit("host_play", {
      video_id: item.video_id,
      song_title: item.song_title,
      artist: item.artist,
      thumbnail_url: item.thumbnail_url,
      duration_seconds: item.duration_seconds,
      position_ms: 0,
    });
  };

  const handleRemove = (index: number) => {
    if (!isHost) return;
    const socket = getSocketInstance();
    socket?.emit("remove_from_queue", { index });
  };

  const handleClear = () => {
    if (!isHost) return;
    const socket = getSocketInstance();
    socket?.emit("clear_queue", {});
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderRadius: "20px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          background: isOpen ? "rgba(124, 58, 237, 0.2)" : undefined,
          border: isOpen ? "1px solid var(--accent)" : undefined,
        }}
        title="View Up Next Queue"
      >
        <span>📑 Queue</span>
        {queue.length > 0 && (
          <span style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "10px",
            padding: "1px 7px",
            fontSize: "10px",
            fontWeight: 700,
          }}>
            {queue.length}
          </span>
        )}
      </button>

      {/* Dropdown / Modal Flyout */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "0",
            marginBottom: "12px",
            width: "340px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
            padding: "16px",
            zIndex: 30,
            maxHeight: "380px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "12px",
          }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
              Up Next ({queue.length})
            </h4>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {isHost && queue.length > 0 && (
                <button
                  onClick={handleClear}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: "11px", color: "var(--error)", padding: "2px 6px" }}
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "12px", padding: "2px 6px" }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-muted)", fontSize: "13px" }}>
                No songs in queue yet.<br />
                {isHost ? "Search a song and click '+ Queue' to queue it up!" : "Host can queue upcoming songs."}
              </div>
            ) : (
              queue.map((item, idx) => (
                <div
                  key={`${item.video_id}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", width: "16px" }}>
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    style={{ width: "42px", height: "30px", borderRadius: "4px", objectFit: "cover" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {item.song_title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {formatDuration(item.duration_seconds)}
                    </div>
                  </div>

                  {isHost && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => handlePlayNow(item, idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "4px", fontSize: "12px" }}
                        title="Play Now"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => handleRemove(idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "4px", fontSize: "12px", color: "var(--error)" }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
