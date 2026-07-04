"use client";

import { useState, useEffect, useRef } from "react";
import { useRoomStore } from "@/store/roomStore";
import { getSocketInstance } from "@/lib/socket";
import api from "@/lib/api";

export default function ChatPanel() {
  const { roomId, messages, setMessages } = useRoomStore();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat history on mount/roomId change
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

  // Auto-scroll to bottom when new messages arrive
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      borderLeft: "1px solid var(--border)",
      background: "var(--bg-secondary)",
      width: "320px",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <h3 className="label">Chat Room</h3>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: "13px",
            textAlign: "center",
            padding: "20px",
          }}>
            No messages yet. Send a message to start chatting!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.message_id || i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#A78BFA" }}>
                  {msg.username}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
              <p style={{
                fontSize: "14px",
                lineHeight: "1.4",
                color: "var(--text-primary)",
                background: "var(--bg-card)",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                alignSelf: "flex-start",
                wordBreak: "break-word",
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
        padding: "16px 20px",
        borderTop: "1px solid var(--border)",
        background: "rgba(15, 15, 15, 0.4)",
        display: "flex",
        gap: "8px",
      }}>
        <input
          className="input"
          type="text"
          placeholder="Send a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          style={{ fontSize: "14px", padding: "10px 14px" }}
          id="chat-message-input"
        />
        <button type="submit" className="btn btn-primary btn-sm" id="chat-message-send" style={{ padding: "0 16px" }}>
          Send
        </button>
      </form>
    </div>
  );
}
