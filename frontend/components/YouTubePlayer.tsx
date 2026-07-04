"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { getSocketInstance } from "@/lib/socket";
import { setVoiceCallback } from "@/lib/webrtc";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function YouTubePlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const { userId } = useAuthStore();
  const { currentSong, hostId, setCurrentSong } = useRoomStore();
  const isHost = userId === hostId;

  const [playerReady, setPlayerReady] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isDucked, setIsDucked] = useState(false);

  // 1. Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      initPlayer();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const initPlayer = () => {
    if (!containerRef.current) return;

    playerRef.current = new window.YT.Player("yt-player-iframe", {
      height: "0", // Hidden video player, or small thumbnail size
      width: "0",
      videoId: currentSong.video_id || "",
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: () => {
          setPlayerReady(true);
          playerRef.current.setVolume(volume);
        },
        onStateChange: (event: any) => {
          // If state changes manually and we are not syncing, and we are host, broadcast command
          if (isHost && !isSyncingRef.current) {
            const socket = getSocketInstance();
            if (!socket) return;
            const state = event.data;

            if (state === window.YT.PlayerState.PLAYING) {
              const currentPosMs = Math.round(playerRef.current.getCurrentTime() * 1000);
              socket.emit("host_play", {
                video_id: currentSong.video_id,
                song_title: currentSong.song_title,
                artist: currentSong.artist,
                thumbnail_url: currentSong.thumbnail_url,
                duration_seconds: currentSong.duration_seconds,
                position_ms: currentPosMs,
              });
            } else if (state === window.YT.PlayerState.PAUSED) {
              const currentPosMs = Math.round(playerRef.current.getCurrentTime() * 1000);
              socket.emit("host_pause", { position_ms: currentPosMs });
            }
          }
        },
      },
    });
  };

  // Setup Voice Activity Callback for Ducking
  useEffect(() => {
    setVoiceCallback((speaking) => {
      if (!playerRef.current || !playerReady) return;
      setIsDucked(speaking);
      if (speaking) {
        // Duck volume to 40% of the currently selected volume
        playerRef.current.setVolume(Math.round(volume * 0.4));
      } else {
        // Restore volume
        playerRef.current.setVolume(volume);
      }
    });

    return () => {
      setVoiceCallback(null);
    };
  }, [playerReady, volume]);

  // Synchronize player with currentSong store updates
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    const syncPlayer = async () => {
      isSyncingRef.current = true;

      const loadedVideoId = playerRef.current.getVideoData?.()?.video_id;
      const targetVideoId = currentSong.video_id;

      // 1. Handle song change
      if (targetVideoId && loadedVideoId !== targetVideoId) {
        playerRef.current.cueVideoById(targetVideoId);
      }

      if (!targetVideoId) {
        playerRef.current.stopVideo();
        isSyncingRef.current = false;
        return;
      }

      // Calculate synchronized position
      let targetPosMs = currentSong.position_ms;
      if (currentSong.is_playing && currentSong.server_timestamp > 0) {
        const elapsed = Date.now() - currentSong.server_timestamp;
        targetPosMs += elapsed;
      }
      const targetPosSec = targetPosMs / 1000;

      // 2. Play or Pause
      if (currentSong.is_playing) {
        const currentPosSec = playerRef.current.getCurrentTime();
        // Allow tiny drift, sync if drift is > 2 seconds
        if (Math.abs(currentPosSec - targetPosSec) > 2) {
          playerRef.current.seekTo(targetPosSec, true);
        }
        playerRef.current.playVideo();
      } else {
        playerRef.current.seekTo(targetPosSec, true);
        playerRef.current.pauseVideo();
      }

      isSyncingRef.current = false;
    };

    syncPlayer();
  }, [currentSong, playerReady]);

  // Progress update timer
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (!playerReady || !playerRef.current || !currentSong.video_id) return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        setLocalProgress(currentTime);

        // If host, let's keep database progress synced every 5 seconds
        if (isHost && currentSong.is_playing && Math.random() < 0.2) {
          const socket = getSocketInstance();
          socket?.emit("host_seek", { position_ms: Math.round(currentTime * 1000) });
        }
      } catch (err) {
        // Player might not be fully active yet
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [playerReady, currentSong.video_id, currentSong.is_playing, isHost]);

  // Handle local control triggers (e.g. clicking Play/Pause buttons in custom UI)
  const togglePlayPause = () => {
    if (!playerReady || !playerRef.current) return;
    const socket = getSocketInstance();
    if (!socket) return;

    const currentPosMs = Math.round(playerRef.current.getCurrentTime() * 1000);

    if (currentSong.is_playing) {
      socket.emit("host_pause", { position_ms: currentPosMs });
    } else {
      socket.emit("host_play", {
        video_id: currentSong.video_id,
        song_title: currentSong.song_title,
        artist: currentSong.artist,
        thumbnail_url: currentSong.thumbnail_url,
        duration_seconds: currentSong.duration_seconds,
        position_ms: currentPosMs,
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || !playerReady || !playerRef.current || !currentSong.duration_seconds) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const targetSeconds = percentage * currentSong.duration_seconds;

    const socket = getSocketInstance();
    if (socket) {
      socket.emit("host_seek", { position_ms: Math.round(targetSeconds * 1000) });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(isDucked ? Math.round(val * 0.4) : val);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "20px",
    }}>
      {/* Hidden YouTube Iframe holder */}
      <div ref={containerRef} style={{ display: "none" }}>
        <div id="yt-player-iframe"></div>
      </div>

      {currentSong.video_id ? (
        <div className="fade-in" style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}>
          {/* Album Art / Video Thumbnail */}
          <div style={{
            position: "relative",
            width: "240px",
            height: "240px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 40px var(--accent-light)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSong.thumbnail_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80"}
              alt="Track Artwork"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {isDucked && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(12, 12, 12, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "600",
                color: "#A78BFA",
                backdropFilter: "blur(2px)",
              }}>
                🎤 Ducking active
              </div>
            )}
          </div>

          {/* Track Info */}
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>
              {currentSong.song_title || "Unknown Title"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {currentSong.artist || "Unknown Artist"}
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{ width: "100%" }}>
            <div
              className="progress-bar-track"
              onClick={handleSeek}
              style={{ cursor: isHost ? "pointer" : "default" }}
            >
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(localProgress / (currentSong.duration_seconds || 1)) * 100}%`,
                }}
              />
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}>
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(currentSong.duration_seconds)}</span>
            </div>
          </div>

          {/* Playback & Volume Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "24px" }}>
            {isHost ? (
              <button
                onClick={togglePlayPause}
                className="btn btn-primary"
                style={{ borderRadius: "50%", width: "64px", height: "64px", padding: 0 }}
                id="player-play-pause"
              >
                <span style={{ fontSize: "24px" }}>{currentSong.is_playing ? "⏸" : "▶"}</span>
              </button>
            ) : (
              <div style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                background: "var(--bg-secondary)",
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
              }}>
                🔒 Controlled by Host
              </div>
            )}

            {/* Volume slider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px", opacity: 0.6 }}>🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  WebkitAppearance: "none",
                  width: "80px",
                  height: "4px",
                  background: "var(--border)",
                  borderRadius: "2px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          color: "var(--text-muted)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{ fontSize: "48px" }}>📻</span>
          <p style={{ fontSize: "14px" }}>
            {isHost ? "Search and play a song to start listening" : "Waiting for the host to play a song..."}
          </p>
        </div>
      )}
    </div>
  );
}
