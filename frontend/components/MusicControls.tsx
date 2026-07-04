"use client";

import { useState, useEffect } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getSocketInstance } from "@/lib/socket";
import api from "@/lib/api";

interface SearchResult {
  video_id: string;
  song_title: string;
  artist: string;
  thumbnail_url: string;
  duration_seconds: number;
}

export default function MusicControls() {
  const { hostId, currentSong } = useRoomStore();
  const { userId } = useAuthStore();
  const isHost = userId === hostId;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load default/fallback list on mount
  useEffect(() => {
    if (!isHost) return;
    const fetchDefault = async () => {
      try {
        const res = await api.get("/rooms/search?q=");
        setResults(res.data.results);
      } catch {}
    };
    fetchDefault();
  }, [isHost]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/rooms/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.results);
      setIsOpen(true);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSong = (song: SearchResult) => {
    const socket = getSocketInstance();
    if (socket?.connected) {
      socket.emit("host_play", {
        video_id: song.video_id,
        song_title: song.song_title,
        artist: song.artist,
        thumbnail_url: song.thumbnail_url,
        duration_seconds: song.duration_seconds,
        position_ms: 0,
      });
      setIsOpen(false);
    }
  };

  if (!isHost) return null;

  return (
    <div style={{
      width: "100%",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-secondary)",
      padding: "16px 24px",
      position: "relative",
      zIndex: 10,
    }}>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            className="input"
            type="text"
            placeholder="🔍 Search YouTube for songs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            id="music-search-input"
            style={{ paddingRight: "40px" }}
          />
          {isOpen && results.length > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "4px 8px",
                height: "auto",
                fontSize: "12px",
              }}
            >
              Close
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} id="music-search-submit">
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: "24px",
          right: "24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          marginTop: "8px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          maxHeight: "320px",
          overflowY: "auto",
        }}>
          {results.map((song) => {
            const isCurrentlyPlaying = currentSong.video_id === song.video_id;
            return (
              <div
                key={song.video_id}
                onClick={() => handleSelectSong(song)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: isCurrentlyPlaying ? "var(--accent-light)" : "transparent",
                  transition: "background 0.2s",
                }}
                className="search-item"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.thumbnail_url}
                  alt=""
                  style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "4px" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: isCurrentlyPlaying ? "#A78BFA" : "var(--text-primary)"
                  }}>
                    {song.song_title}
                  </h4>
                  <p style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {song.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
