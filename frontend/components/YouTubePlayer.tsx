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
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  const { userId } = useAuthStore();
  const { currentSong, hostId } = useRoomStore();
  const isHost = userId === hostId;

  const [playerReady, setPlayerReady] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tunetogether_volume");
        if (saved) {
          const v = Number(saved);
          if (!isNaN(v) && v >= 0 && v <= 100) return v;
        }
      } catch {}
    }
    return 70;
  });
  const [isDucked, setIsDucked] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Initialize YouTube Iframe API
  useEffect(() => {
    mountedRef.current = true;

    const checkAndInit = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return true;
      }
      return false;
    };

    if (checkAndInit()) return;

    // Load the IFrame Player API code asynchronously.
    if (!document.getElementById("yt-iframe-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      if (mountedRef.current) initPlayer();
    };

    // Polling fallback in case onYouTubeIframeAPIReady already fired
    const interval = setInterval(() => {
      if (checkAndInit()) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const initPlayer = () => {
    if (!document.getElementById("yt-player-iframe") || playerRef.current) return;

    try {
      playerRef.current = new window.YT.Player("yt-player-iframe", {
        width: "100%",
        height: "100%",
        videoId: currentSong.video_id || "",
        playerVars: {
          autoplay: 0,
          controls: isHost ? 1 : 0,
          disablekb: isHost ? 0 : 1,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            try {
              event.target.setVolume(volume);
            } catch {}
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setAutoplayBlocked(false);
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              if (isHost) {
                const socket = getSocketInstance();
                socket?.emit("host_song_ended", { video_id: currentSong.video_id });
              }
              return;
            }
            if (isHost && !isSyncingRef.current) {
              const socket = getSocketInstance();
              if (!socket) return;
              if (event.data === window.YT.PlayerState.PAUSED) {
                const currentPosMs = Math.round((playerRef.current?.getCurrentTime?.() || 0) * 1000);
                socket.emit("host_pause", { position_ms: currentPosMs });
              }
            } else if (!isHost && !isSyncingRef.current) {
              // Viewer: prevent accidental pause or desync
              if (currentSong.is_playing && event.data === window.YT.PlayerState.PAUSED) {
                try { playerRef.current?.playVideo?.(); } catch {}
              } else if (!currentSong.is_playing && event.data === window.YT.PlayerState.PLAYING) {
                try { playerRef.current?.pauseVideo?.(); } catch {}
              }
            }
          },
          onError: (e: any) => {
            console.warn("YouTube Player error:", e?.data);
          },
        },
      });
    } catch (e) {
      console.warn("Failed to instantiate YT.Player", e);
    }
  };

  // Voice Ducking (smoothly lower volume when speaking)
  useEffect(() => {
    setVoiceCallback((speaking) => {
      if (!playerRef.current || !playerReady) return;
      setIsDucked(speaking);
      try {
        if (speaking) {
          playerRef.current.setVolume(Math.round(volume * 0.4));
        } else {
          playerRef.current.setVolume(volume);
        }
      } catch {}
    });

    return () => {
      setVoiceCallback(null);
    };
  }, [playerReady, volume]);

  // Synchronize player with currentSong store updates
  useEffect(() => {
    if (!playerReady || !playerRef.current || !playerRef.current.loadVideoById) return;

    const videoId = currentSong.video_id;
    if (!videoId) {
      try { playerRef.current.stopVideo?.(); } catch {}
      return;
    }

    isSyncingRef.current = true;

    // Calculate synchronized position
    let targetPosMs = currentSong.position_ms || 0;
    if (currentSong.is_playing && currentSong.server_timestamp > 0) {
      const elapsed = Date.now() - currentSong.server_timestamp;
      targetPosMs += elapsed;
    }
    const targetPosSec = Math.max(0, targetPosMs / 1000);

    const loadedId = playerRef.current.getVideoData?.()?.video_id;

    if (loadedId !== videoId) {
      if (currentSong.is_playing) {
        try {
          playerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: targetPosSec,
          });
        } catch {}
      } else {
        try {
          playerRef.current.cueVideoById({
            videoId: videoId,
            startSeconds: targetPosSec,
          });
        } catch {}
      }
    } else {
      const currentPosSec = playerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(currentPosSec - targetPosSec) > 2) {
        try { playerRef.current.seekTo?.(targetPosSec, true); } catch {}
      }

      if (currentSong.is_playing) {
        const state = playerRef.current.getPlayerState?.();
        if (state !== 1) { // 1 = PLAYING
          try {
            const playPromise = playerRef.current.playVideo?.();
            if (playPromise && playPromise.catch) {
              playPromise.catch(() => setAutoplayBlocked(true));
            }
          } catch {
            setAutoplayBlocked(true);
          }
        }
      } else {
        const state = playerRef.current.getPlayerState?.();
        if (state !== 2) { // 2 = PAUSED
          try { playerRef.current.pauseVideo?.(); } catch {}
        }
      }
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 600);
  }, [currentSong, playerReady]);

  // Progress update interval and continuous host synchronization
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (!playerReady || !playerRef.current || !currentSong.video_id) return;
      try {
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        setLocalProgress(currentTime);

        // Keep database progress synced periodically by host
        if (isHost && currentSong.is_playing && Math.random() < 0.2) {
          const socket = getSocketInstance();
          socket?.emit("host_seek", { position_ms: Math.round(currentTime * 1000) });
        }

        // Strict synchronization for viewers
        if (!isHost && !isSyncingRef.current && currentSong.video_id) {
          let targetPosMs = currentSong.position_ms || 0;
          if (currentSong.is_playing && currentSong.server_timestamp > 0) {
            targetPosMs += Date.now() - currentSong.server_timestamp;
          }
          const targetPosSec = Math.max(0, targetPosMs / 1000);
          const state = playerRef.current.getPlayerState?.();

          if (currentSong.is_playing) {
            // If viewer is paused (2), cued (5), or unstarted (-1), resume
            if (state === 2 || state === 5 || state === -1) {
              playerRef.current.playVideo?.();
            }
            // If viewer drifted by more than 1.5 seconds, resync position
            if (Math.abs(currentTime - targetPosSec) > 1.5) {
              playerRef.current.seekTo?.(targetPosSec, true);
            }
          } else {
            // Host is paused, ensure viewer is paused
            if (state === 1) {
              playerRef.current.pauseVideo?.();
            }
          }
        }
      } catch {}
    }, 1000);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [playerReady, currentSong.video_id, currentSong.is_playing, currentSong.position_ms, currentSong.server_timestamp, isHost]);

  // Controls
  const togglePlayPause = () => {
    if (!playerReady || !playerRef.current) return;
    const socket = getSocketInstance();
    if (!socket) return;

    const currentPosMs = Math.round((playerRef.current.getCurrentTime?.() || 0) * 1000);

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
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = percentage * currentSong.duration_seconds;

    const socket = getSocketInstance();
    if (socket) {
      socket.emit("host_seek", { position_ms: Math.round(targetSeconds * 1000) });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    try {
      localStorage.setItem("tunetogether_volume", String(val));
    } catch {}
    if (playerReady && playerRef.current) {
      try {
        playerRef.current.setVolume(isDucked ? Math.round(val * 0.4) : val);
        playerRef.current.unMute?.();
      } catch {}
    }
  };

  const handleManualPlay = () => {
    if (playerRef.current) {
      try {
        let targetPosMs = currentSong.position_ms || 0;
        if (currentSong.is_playing && currentSong.server_timestamp > 0) {
          targetPosMs += Date.now() - currentSong.server_timestamp;
        }
        playerRef.current.seekTo?.(Math.max(0, targetPosMs / 1000), true);
        if (currentSong.is_playing) {
          playerRef.current.playVideo?.();
        }
        playerRef.current.unMute?.();
      } catch {}
      setAutoplayBlocked(false);
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
      gap: "20px",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "20px",
      width: "100%",
    }}>
      {/* Video player container — always kept in DOM so YT iframe is measurable and initialized */}
      <div style={{
        position: currentSong.video_id ? "relative" : "absolute",
        left: currentSong.video_id ? "auto" : "-9999px",
        opacity: currentSong.video_id ? 1 : 0,
        pointerEvents: currentSong.video_id ? "auto" : "none",
        width: "100%",
        maxWidth: "600px",
        aspectRatio: "16/9",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 40px var(--accent-light)",
        border: "1px solid var(--border)",
        background: "#000",
      }}>
        <div id="yt-player-iframe" style={{ width: "100%", height: "100%" }}></div>

        {/* Track Ended Clean State Overlay — eliminates YouTube recommended cards */}
        {!currentSong.is_playing && currentSong.video_id && localProgress > 0 && currentSong.duration_seconds > 0 && localProgress >= (currentSong.duration_seconds - 3) && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10, 10, 10, 0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            zIndex: 8,
            backdropFilter: "blur(6px)",
            padding: "24px",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "40px" }}>🎉</span>
            <div>
              <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", margin: "0 0 6px 0" }}>
                Track Finished
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                {isHost ? "Choose a new track from Search or check your Queue" : "Waiting for the host to pick the next track..."}
              </p>
            </div>
          </div>
        )}

        {/* Guest click shield: Only host can click/pause/scrub the video player */}
        {!isHost && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              cursor: "default",
            }}
            title="Playback controlled by Host"
          />
        )}

        {isDucked && (
          <div style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(12, 12, 12, 0.8)",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#A78BFA",
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
            zIndex: 5,
          }}>
            🎤 Ducking active (40%)
          </div>
        )}

        {autoplayBlocked && (
          <div
            onClick={handleManualPlay}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 15, 15, 0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <button className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "15px" }}>
              ▶ Click to Sync Audio
            </button>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Browser blocked background audio
            </span>
          </div>
        )}
      </div>

      {currentSong.video_id ? (
        <div className="fade-in" style={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}>
          {/* Track Info */}
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>
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
                style={{ borderRadius: "50%", width: "56px", height: "56px", padding: 0 }}
                id="player-play-pause"
              >
                <span style={{ fontSize: "22px" }}>{currentSong.is_playing ? "⏸" : "▶"}</span>
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
                  width: "90px",
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
          <p style={{ fontSize: "15px", fontWeight: "500" }}>
            {isHost ? "Search and play a song to start listening" : "Waiting for the host to play a song..."}
          </p>
        </div>
      )}
    </div>
  );
}
