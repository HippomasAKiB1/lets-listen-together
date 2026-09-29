"use client";

import { useState, useEffect, useRef } from "react";
import { useRoomStore } from "@/store/roomStore";
import { getSocketInstance } from "@/lib/socket";
import api from "@/lib/api";

interface ChatPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ChatPanel({ className = "", style = {} }: ChatPanelProps) {
  const { roomId, messages, setMessages } = useRoomStore();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}/messages`);
        setMessages(res.data.messages);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    fetchHistory();
  }, [roomId, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    const socket = getSocketInstance();
    if (socket?.connected) {
      socket.emit("send_chat", { content: text });
      setContent("");
    }
  };

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
      {/* Header Bar */}
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
          CHAT
        </h3>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "var(--bg)",
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            textAlign: "center",
            padding: "20px",
            border: "1px dashed var(--ink)",
            margin: "20px 0",
          }}>
            NO MESSAGES YET. SEND A MESSAGE.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.message_id || i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                  {msg.username}
                </span>
                <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                  {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
              <p style={{
                fontSize: "12px",
                lineHeight: "1.4",
                color: "var(--ink)",
                background: "var(--surface)",
                padding: "8px 10px",
                border: "var(--border-thin)",
                boxShadow: "var(--shadow-hard-sm)",
                wordBreak: "break-word",
                fontFamily: "var(--font-mono)",
              }}>
                {msg.content}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} style={{
        padding: "12px",
        borderTop: "var(--border)",
        background: "var(--surface)",
        display: "flex",
        gap: "8px",
      }}>
        <input
          className="input"
          type="text"
          placeholder="ENTER MESSAGE..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          enterKeyHint="send"
          autoComplete="off"
          style={{ minHeight: "44px", padding: "8px 12px" }}
          id="chat-message-input"
        />
        <button
          type="submit"
          className="btn btn-primary"
          id="chat-message-send"
          style={{ padding: "0 16px", minHeight: "44px", minWidth: "60px" }}
        >
          SEND
        </button>
      </form>
    </div>
  );
}
