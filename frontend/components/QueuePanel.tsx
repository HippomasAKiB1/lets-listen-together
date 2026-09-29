"use client";

import { useState } from "react";
import { useRoomStore, QueueItem } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getSocketInstance } from "@/lib/socket";

interface QueuePanelProps {
  isPane?: boolean;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function QueuePanel({ isPane = false, onClose, className = "", style = {} }: QueuePanelProps) {
  const { queue, hostId } = useRoomStore();
  const { userId } = useAuthStore();
  const isHost = userId === hostId;
  const [isOpen, setIsOpen] = useState(false);

  const handlePlayNow = (item: QueueItem, index: number) => {
    if (!isHost) return;
    const socket = getSocketInstance();
    if (!socket) return;

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

  // ── PANE MODE (FOR MOBILE TABS) ──
  if (isPane) {
    return (
      <div
        className={`scroll-contain ${className}`}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "var(--surface)",
          color: "var(--ink)",
          ...style,
        }}
      >
        {/* Header */}
        <div style={{
          padding: "10px 16px",
          background: "var(--ink)",
          color: "var(--ink-light)",
          borderBottom: "var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "44px",
        }}>
          <h3 style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.06em" }}>
            UP NEXT QUEUE ({queue.length})
          </h3>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isHost && queue.length > 0 && (
              <button
                onClick={handleClear}
                className="btn btn-ghost-dark btn-sm"
                style={{ fontSize: "11px", minHeight: "36px", padding: "4px 8px", color: "var(--error)" }}
              >
                CLEAR ALL
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-ghost-dark btn-sm"
                style={{ minHeight: "44px", minWidth: "44px", padding: "6px 10px", fontSize: "11px" }}
              >
                ✕ CLOSE
              </button>
            )}
          </div>
        </div>

        {/* Queue Items */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          background: "var(--bg)",
        }}>
          {queue.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "36px 16px",
              color: "var(--muted)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              border: "2px dashed var(--ink)",
              margin: "16px 0",
              background: "var(--surface)",
            }}>
              NO TRACKS IN QUEUE.<br />
              {isHost ? "SEARCH FOR A SONG ABOVE TO ADD TO QUEUE." : "WAITING FOR TRACKS TO BE ADDED BY HOST."}
            </div>
          ) : (
            queue.map((item, idx) => (
              <div
                key={`${item.video_id}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "var(--surface)",
                  border: "var(--border)",
                  boxShadow: "var(--shadow-hard-sm)",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--ink)", width: "20px" }}>
                  {idx + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail_url}
                  alt=""
                  style={{ width: "48px", height: "36px", border: "1px solid var(--ink)", objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {item.song_title}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                    {formatDuration(item.duration_seconds)}
                  </div>
                </div>

                {isHost && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handlePlayNow(item, idx)}
                      className="btn btn-primary btn-sm"
                      style={{ minHeight: "36px", padding: "4px 8px", fontSize: "11px" }}
                      title="PLAY NOW"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="btn btn-danger btn-sm"
                      style={{ minHeight: "36px", padding: "4px 8px", fontSize: "11px" }}
                      title="REMOVE"
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
    );
  }

  // ── FLYOUT MODE (FOR DESKTOP FOOTER) ──
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
          minHeight: "36px",
          padding: "6px 12px",
          fontSize: "11px",
          background: isOpen ? "var(--accent)" : "var(--accent-alt)",
          color: isOpen ? "#FFFFFF" : "var(--ink)",
        }}
        title="VIEW UP NEXT QUEUE"
      >
        <span>QUEUE</span>
        <span style={{
          background: "var(--ink)",
          color: "var(--accent-alt)",
          padding: "1px 6px",
          fontSize: "10px",
          fontWeight: 900,
        }}>
          {queue.length}
        </span>
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div
          className="scroll-contain"
          style={{
            position: "absolute",
            bottom: "100%",
            right: "0",
            marginBottom: "8px",
            width: "360px",
            maxWidth: "calc(100vw - 32px)",
            background: "var(--surface)",
            border: "var(--border)",
            boxShadow: "var(--shadow-hard-lg)",
            padding: "16px",
            zIndex: 40,
            maxHeight: "380px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "10px",
            borderBottom: "var(--border)",
            marginBottom: "12px",
          }}>
            <h4 style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, margin: 0 }}>
              QUEUE ({queue.length})
            </h4>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {isHost && queue.length > 0 && (
                <button
                  onClick={handleClear}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: "10px", color: "var(--error)", padding: "2px 6px" }}
                >
                  CLEAR ALL
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "11px", minHeight: "32px", minWidth: "32px", padding: "2px 6px" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", display: "flex", flexDirection: "column", gap: "6px" }}>
            {queue.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "24px 12px",
                color: "var(--muted)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                border: "1px dashed var(--ink)",
                margin: "12px 0",
              }}>
                NO TRACKS IN QUEUE.<br />
                {isHost ? "SEARCH FOR A SONG TO ADD TO QUEUE." : "WAITING FOR TRACKS TO BE ADDED."}
              </div>
            ) : (
              queue.map((item, idx) => (
                <div
                  key={`${item.video_id}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px",
                    background: "var(--bg)",
                    border: "var(--border-thin)",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--ink)", width: "18px" }}>
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    style={{ width: "42px", height: "30px", border: "1px solid var(--ink)", objectFit: "cover" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {item.song_title}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                      {formatDuration(item.duration_seconds)}
                    </div>
                  </div>

                  {isHost && (
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button
                        onClick={() => handlePlayNow(item, idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                        title="PLAY NOW"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => handleRemove(idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "4px 8px", fontSize: "11px", color: "var(--error)" }}
                        title="REMOVE"
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
