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

  const handleAddToQueue = (e: React.MouseEvent, song: SearchResult) => {
    e.stopPropagation();
    const socket = getSocketInstance();
    if (socket?.connected) {
      socket.emit("add_to_queue", {
        video_id: song.video_id,
        song_title: song.song_title,
        artist: song.artist,
        thumbnail_url: song.thumbnail_url,
        duration_seconds: song.duration_seconds,
      });
    }
  };

  if (!isHost) return null;

  return (
    <div style={{
      width: "100%",
      borderBottom: "var(--border-thin)",
      background: "var(--bg)",
      padding: "10px 16px",
      position: "relative",
      zIndex: 20,
    }}>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            className="input"
            type="text"
            placeholder="SEARCH YOUTUBE..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            id="music-search-input"
            style={{ paddingRight: "60px", fontSize: "12px", padding: "10px 12px" }}
          />
          {isOpen && results.length > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-sm"
              style={{
                position: "absolute",
                right: "4px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "2px 6px",
                fontSize: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading} id="music-search-submit">
          {loading ? "SEARCHING..." : "SEARCH"}
        </button>
      </form>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: "16px",
          right: "16px",
          background: "var(--surface)",
          border: "var(--border)",
          boxShadow: "var(--shadow-hard-lg)",
          marginTop: "4px",
          maxHeight: "300px",
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
                  gap: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "var(--border-thin)",
                  background: isCurrentlyPlaying ? "var(--accent-alt)" : "transparent",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.thumbnail_url}
                  alt=""
                  style={{ width: "44px", height: "32px", objectFit: "cover", border: "1px solid var(--ink)" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {song.song_title}
                  </h4>
                  <p style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {song.artist}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={(e) => handleAddToQueue(e, song)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "10px", padding: "3px 8px" }}
                    title="ADD TO QUEUE"
                  >
                    QUEUE +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSong(song)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "10px", padding: "3px 8px" }}
                    title="PLAY IMMEDIATELY"
                  >
                    PLAY ▶
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
