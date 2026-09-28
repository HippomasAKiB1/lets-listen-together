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
  const initialLoadGraceRef = useRef<number>(0);
  const hasEndedRef = useRef<boolean>(false);

  const { userId } = useAuthStore();
  const { currentSong, hostId, queue } = useRoomStore();
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
              if (isHost && !hasEndedRef.current) {
                hasEndedRef.current = true;
                const socket = getSocketInstance();
                socket?.emit("host_song_ended", { video_id: currentSong.video_id });
              }
              return;
            }
            if (isHost && !isSyncingRef.current) {
              const currentSec = playerRef.current?.getCurrentTime?.() || 0;
              const duration = currentSong.duration_seconds || 0;
              // If paused within 1.5s of track completion, it is track completion!
              if (duration > 0 && currentSec >= duration - 1.5) {
                if (!hasEndedRef.current) {
                  hasEndedRef.current = true;
                  const socket = getSocketInstance();
                  socket?.emit("host_song_ended", { video_id: currentSong.video_id });
                }
                return;
              }

              const socket = getSocketInstance();
              if (!socket) return;
              if (event.data === window.YT.PlayerState.PAUSED) {
                const currentPosMs = Math.round(currentSec * 1000);
                socket.emit("host_pause", { position_ms: currentPosMs });
              }
            } else if (!isHost && !isSyncingRef.current && Date.now() > initialLoadGraceRef.current) {
              // Viewer: prevent accidental pause or desync after initial load
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
      hasEndedRef.current = false;
      initialLoadGraceRef.current = Date.now() + 3500;
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
      if (Math.abs(currentPosSec - targetPosSec) > 2.5) {
        try { playerRef.current.seekTo?.(targetPosSec, true); } catch {}
      }

      if (currentSong.is_playing) {
        const state = playerRef.current.getPlayerState?.();
        if (state !== 1 && state !== 3) { // not PLAYING and not BUFFERING
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
    }, 1200);
  }, [currentSong, playerReady]);

  // Progress update interval and continuous host synchronization
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (!playerReady || !playerRef.current || !currentSong.video_id) return;
      try {
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        setLocalProgress(currentTime);

        // Host: detect track ending near the duration boundary
        if (isHost && currentSong.is_playing && currentSong.duration_seconds > 0 && currentTime >= currentSong.duration_seconds - 0.8) {
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            const socket = getSocketInstance();
            socket?.emit("host_song_ended", { video_id: currentSong.video_id });
          }
          return;
        }

        // Keep database progress synced periodically by host
        if (isHost && currentSong.is_playing && Math.random() < 0.2) {
          const socket = getSocketInstance();
          socket?.emit("host_seek", { position_ms: Math.round(currentTime * 1000) });
        }

        // Natural, smooth synchronization for viewers
        if (!isHost && !isSyncingRef.current && currentSong.video_id && Date.now() > initialLoadGraceRef.current) {
          const state = playerRef.current.getPlayerState?.();

          // Never interrupt while buffering (3) or unstarted (-1)
          if (state === 3 || state === -1) {
            return;
          }

          let targetPosMs = currentSong.position_ms || 0;
          if (currentSong.is_playing && currentSong.server_timestamp > 0) {
            targetPosMs += Date.now() - currentSong.server_timestamp;
          }
          const targetPosSec = Math.max(0, targetPosMs / 1000);

          if (currentSong.is_playing) {
            // Resume if paused
            if (state === 2 || state === 5) {
              playerRef.current.playVideo?.();
            }
            // Only seek if drift exceeds 2.5s (prevents audio micro-stutters and buffer loops)
            if (state === 1 && Math.abs(currentTime - targetPosSec) > 2.5) {
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

  const handleNextTrack = () => {
    if (!isHost) return;
    hasEndedRef.current = false;
    const socket = getSocketInstance();
    socket?.emit("host_next_track", {});
  };

  const handlePrevTrack = () => {
    if (!isHost) return;
    hasEndedRef.current = false;
    const currentTime = playerRef.current?.getCurrentTime?.() || 0;
    if (currentTime > 3) {
      playerRef.current?.seekTo?.(0, true);
      const socket = getSocketInstance();
      socket?.emit("host_seek", { position_ms: 0 });
    } else {
      const socket = getSocketInstance();
      socket?.emit("host_prev_track", {});
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
        overflow: "hidden",
        boxShadow: "var(--shadow-hard-lg)",
        border: "var(--border)",
        background: "#000000",
      }}>
        <div id="yt-player-iframe" style={{ width: "100%", height: "100%" }}></div>

        {/* Track Ended Clean State Overlay */}
        {!currentSong.is_playing && currentSong.video_id && localProgress > 0 && currentSong.duration_seconds > 0 && localProgress >= (currentSong.duration_seconds - 3) && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "#0A0A0A",
            border: "var(--border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            zIndex: 8,
            padding: "24px",
            textAlign: "center",
          }}>
            <span style={{
              background: "var(--accent-alt)",
              color: "#0A0A0A",
              border: "1px solid #000",
              padding: "2px 8px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 900,
            }}>
              TRACK FINISHED
            </span>
            <div>
              <h4 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                TRACK ENDED
              </h4>
              <p style={{ fontSize: "12px", color: "var(--muted-light)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {isHost ? "SELECT A NEW TRACK FROM SEARCH OR ADVANCE QUEUE" : "WAITING FOR NEXT TRACK FROM HOST…"}
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
            title="PLAYBACK CONTROLLED BY HOST"
          />
        )}

        {isDucked && (
          <div style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "var(--accent-alt)",
            color: "var(--ink)",
            border: "1px solid var(--ink)",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "700",
            fontFamily: "var(--font-mono)",
            pointerEvents: "none",
            zIndex: 5,
          }}>
            VOICE DUCKING ACTIVE
          </div>
        )}

        {autoplayBlocked && (
          <div
            onClick={handleManualPlay}
            style={{
              position: "absolute",
              inset: 0,
              background: "#0A0A0A",
              border: "var(--border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <button className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "13px" }}>
              CLICK TO PLAY AUDIO ▶
            </button>
            <span style={{ fontSize: "11px", color: "var(--accent-alt)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              CLICK TO UNMUTE AUDIO
            </span>
          </div>
        )}
      </div>

      {currentSong.video_id ? (
        <div style={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          background: "var(--surface)",
          border: "var(--border)",
          boxShadow: "var(--shadow-hard)",
          padding: "20px 24px",
        }}>
          {/* Track Info */}
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "16px", letterSpacing: "-0.01em", marginBottom: "4px" }}>
              {currentSong.song_title || "UNTITLED TRACK"}
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              {currentSong.artist || "UNKNOWN ARTIST"}
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
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--muted)",
              marginTop: "6px",
            }}>
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(currentSong.duration_seconds)}</span>
            </div>
          </div>

          {/* Playback & Volume Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "12px" }}>
            {/* Host Previous Track Button */}
            {isHost && (
              <button
                onClick={handlePrevTrack}
                className="btn btn-secondary btn-icon"
                style={{ width: "40px", height: "40px" }}
                title="PREVIOUS TRACK"
              >
                <span>⏮</span>
              </button>
            )}

            {isHost ? (
              <button
                onClick={togglePlayPause}
                className="btn btn-primary btn-icon"
                style={{ width: "46px", height: "46px" }}
                id="player-play-pause"
                title={currentSong.is_playing ? "PAUSE" : "PLAY"}
              >
                <span style={{ fontSize: "18px" }}>{currentSong.is_playing ? "⏸" : "▶"}</span>
              </button>
            ) : (
              <div style={{
                color: "var(--ink)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                background: "var(--bg)",
                padding: "6px 12px",
                border: "var(--border-thin)",
              }}>
                CONTROLLED BY HOST
              </div>
            )}

            {/* Host Next Track Button */}
            {isHost && (
              <button
                onClick={handleNextTrack}
                className="btn btn-secondary btn-icon"
                style={{
                  width: "40px",
                  height: "40px",
                  opacity: queue.length > 0 ? 1 : 0.6,
                }}
                title={queue.length > 0 ? `NEXT: ${queue[0]?.song_title}` : "NEXT TRACK (QUEUE EMPTY)"}
              >
                <span>⏭</span>
              </button>
            )}

            {/* Volume slider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "8px",
              background: "var(--bg)",
              border: "var(--border-thin)",
              padding: "4px 8px",
            }}>
              <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>VOL</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  WebkitAppearance: "none",
                  width: "70px",
                  height: "6px",
                  background: "var(--ink)",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          color: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          background: "var(--surface)",
          border: "var(--border)",
          boxShadow: "var(--shadow-hard)",
          padding: "32px 24px",
          maxWidth: "460px",
          textAlign: "center",
        }}>
          <span style={{
            background: "var(--ink)",
            color: "var(--accent-alt)",
            padding: "4px 8px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            NO TRACK PLAYING
          </span>
          <h4 style={{ fontSize: "16px", letterSpacing: "-0.01em", margin: "4px 0" }}>
            {isHost ? "SEARCH FOR A SONG TO PLAY" : "WAITING FOR HOST TO PLAY A TRACK"}
          </h4>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {isHost ? "USE THE SEARCH BAR ABOVE TO FIND A SONG OR ADD TO QUEUE." : "ONCE THE HOST STARTS PLAYING, AUDIO AND VIDEO WILL PLAY IN SYNC."}
          </p>
        </div>
      )}
    </div>
  );
}
