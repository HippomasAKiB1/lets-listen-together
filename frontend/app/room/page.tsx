"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore, Member } from "@/store/roomStore";
import { getSocket, disconnectSocket } from "@/lib/socket";
import {
  initLocalStream,
  stopLocalStream,
  createPeer,
  getPeer,
  destroyAllPeers,
  setMuted,
  cleanupAudio,
} from "@/lib/webrtc";
import MemberList from "@/components/MemberList";
import ChatPanel from "@/components/ChatPanel";
import YouTubePlayer from "@/components/YouTubePlayer";
import ScreenShareViewer from "@/components/ScreenShareViewer";
import MusicControls from "@/components/MusicControls";
import ModeSelector from "@/components/ModeSelector";
import QueuePanel from "@/components/QueuePanel";
import FloatingReactions from "@/components/FloatingReactions";
import { REACTION_ITEMS } from "@/lib/reactions";
import { useConfirm } from "@/components/ConfirmModal";
import api from "@/lib/api";

type MobileTab = "player" | "chat" | "members" | "queue";

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id");
  const confirm = useConfirm();

  const { token, userId, isAuthenticated } = useAuthStore();
  const {
    roomName,
    inviteCode,
    hostId,
    currentSong,
    members,
    queue,
    messages,
    setRoom,
    setMembers,
    setMemberSpeaking,
    setMemberMic,
    setHostId,
    setCurrentSong,
    setQueue,
    addReaction,
    addMessage,
    clearRoom,
  } = useRoomStore();

  const socketRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerHeight, setPlayerHeight] = useState<number>(240);
  const [loading, setLoading] = useState(true);
  const [micMuted, setMicMuted] = useState(true);
  const [micError, setMicError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("player");
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false);
  const [isLandscapePhone, setIsLandscapePhone] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHost = userId === hostId;

  // Track viewport orientation and desktop breakpoint (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      const isLand = window.innerWidth > window.innerHeight && window.innerHeight <= 500;
      setIsLandscapePhone(isLand);
      setIsDesktopLayout(window.innerWidth >= 768);
      if (playerContainerRef.current && playerContainerRef.current.offsetHeight > 0) {
        const nextH = playerContainerRef.current.offsetHeight;
        setPlayerHeight((prev) => (Math.abs(prev - nextH) > 1 ? nextH : prev));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    if (typeof screen !== "undefined" && screen.orientation) {
      screen.orientation.addEventListener("change", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (typeof screen !== "undefined" && screen.orientation) {
        screen.orientation.removeEventListener("change", handleResize);
      }
    };
  }, []);

  // Measure player container height for explicit chat height formula on mobile
  useEffect(() => {
    if (!playerContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          const nextH = Math.round(entry.contentRect.height);
          setPlayerHeight((prev) => (Math.abs(prev - nextH) > 1 ? nextH : prev));
        }
      }
    });
    observer.observe(playerContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 1. Redirect if not authenticated or no roomId
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    } else if (!roomId) {
      router.push("/home");
    }
  }, [isAuthenticated, roomId, router]);

  // 2. Initialize connection, signaling, WebRTC
  useEffect(() => {
    if (!token || !roomId) return;

    let socket: any = null;

    const setup = async () => {
      try {
        // Fallback loading timeout (e.g. offline, slow websocket, or mock testing)
        const syncTimeout = setTimeout(() => {
          setLoading(false);
        }, 1500);

        // Pre-fetch room metadata so host and guests see room name & invite code immediately
        try {
          const roomRes = await api.get(`/rooms/${roomId}`);
          if (roomRes?.data) {
            setRoom({
              roomId,
              roomName: roomRes.data.room_name,
              hostId: roomRes.data.host_id,
              inviteCode: roomRes.data.invite_code,
              members: roomRes.data.members || [],
              currentSong: roomRes.data.current_song || {},
            });
          }
        } catch (e) {
          console.warn("Could not pre-fetch room metadata:", e);
        }

        // Capture microphone stream (default to muted) with timeout for headless/unsupported environments
        try {
          await Promise.race([
            initLocalStream(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Mic init timeout")), 1200))
          ]);
          setMuted(true);
        } catch (err) {
          console.warn("Microphone access unavailable or denied:", err);
          setMicError("Microphone access denied. You won't be able to speak, but you can listen.");
        }

        // Connect socket
        socket = getSocket(token, roomId);
        socketRef.current = socket;

        // Setup WebSocket event listeners
        socket.on("sync_state", (data: any) => {
          clearTimeout(syncTimeout);
          setRoom({
            roomId,
            roomName: data.room_name || data.roomName || useRoomStore.getState().roomName || "Listening Room",
            hostId: data.host_id,
            inviteCode: data.invite_code || data.inviteCode || useRoomStore.getState().inviteCode || "",
            members: data.members || [],
            queue: data.queue || [],
            currentSong: data.current_song || {},
          });
          setLoading(false);

          (data.members || []).forEach((member: Member) => {
            if (member.user_id !== userId) {
              socket.emit("join_webrtc_mesh", { target_user_id: member.user_id });
            }
          });
        });

        socket.on("member_joined", (data: any) => {
          setMembers(data.members);
          addMessage({
            message_id: Math.random().toString(),
            username: "System",
            content: `${data.username} joined the room.`,
            sent_at: new Date().toISOString(),
          });
        });

        socket.on("member_left", (data: any) => {
          setMembers(data.members);
          addMessage({
            message_id: Math.random().toString(),
            username: "System",
            content: `${data.username} left the room.`,
            sent_at: new Date().toISOString(),
          });
        });

        socket.on("member_mic_changed", (data: any) => {
          setMemberMic(data.user_id, data.is_muted);
        });

        socket.on("member_speaking", (data: any) => {
          setMemberSpeaking(data.user_id, data.is_speaking);
        });

        socket.on("queue_updated", (data: any) => {
          setQueue(data.queue || []);
        });

        socket.on("song_ended", () => {
          setCurrentSong({ is_playing: false });
        });

        socket.on("host_transferred", (data: any) => {
          setHostId(data.new_host_id);
          addMessage({
            message_id: Math.random().toString(),
            username: "System",
            content: "👑 Room host role has been transferred.",
            sent_at: new Date().toISOString(),
          });
        });

        socket.on("kicked", async (data: any) => {
          await confirm({
            title: "REMOVED FROM ROOM",
            message: (data.reason || "YOU WERE REMOVED FROM THE ROOM BY THE HOST.").toUpperCase(),
            variant: "danger",
            confirmLabel: "OK",
            cancelLabel: null,
          });
          cleanupAndLeave();
        });

        socket.on("reaction_received", (data: any) => {
          addReaction(data);
          setTimeout(() => {
            useRoomStore.getState().removeReaction(data.id);
          }, 3500);
        });

        // WebRTC Signaling Relay
        socket.on("webrtc_offer", (data: any) => {
          let peer = getPeer(data.from_sid);
          if (!peer) {
            peer = createPeer(data.from_sid, data.user_id, data.username, false, socket);
          }
          peer.signal(data.signal);
        });

        socket.on("webrtc_answer", (data: any) => {
          const peer = getPeer(data.from_sid);
          if (peer) {
            peer.signal(data.signal);
          }
        });

        socket.on("webrtc_ice", (data: any) => {
          const peer = getPeer(data.from_sid);
          if (peer) {
            peer.signal(data.signal);
          }
        });

        socket.on("initiate_peer", (data: any) => {
          let peer = getPeer(data.sid);
          if (!peer) {
            createPeer(data.sid, data.user_id, data.username, true, socket);
          }
        });

        // Sync Music states
        socket.on("play", (payload: any) => {
          setCurrentSong({ ...payload, is_playing: true });
        });

        socket.on("pause", (payload: any) => {
          setCurrentSong({ position_ms: payload.position_ms, server_timestamp: payload.server_timestamp, is_playing: false });
        });

        socket.on("seek", (payload: any) => {
          setCurrentSong({ position_ms: payload.position_ms, server_timestamp: payload.server_timestamp });
        });

        socket.on("mode_changed", (payload: any) => {
          setCurrentSong({ mode: payload.mode });
        });

        socket.on("chat_message", (msg: any) => {
          addMessage(msg);
        });

        socket.on("room_ended", async (data: any) => {
          await confirm({
            title: "ROOM ENDED",
            message: (data.reason || "ROOM HAS BEEN ENDED.").toUpperCase(),
            variant: "danger",
            confirmLabel: "OK",
            cancelLabel: null,
          });
          cleanupAndLeave();
        });

      } catch (err) {
        console.error("Room connection setup failed", err);
        setLoading(false);
      }
    };

    setup();

    return () => {
      cleanupAndLeave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roomId]);

  const cleanupAndLeave = () => {
    destroyAllPeers();
    stopLocalStream();
    cleanupAudio();
    disconnectSocket();
    clearRoom();
    router.push("/home");
  };

  const handleMuteToggle = () => {
    const next = !micMuted;
    setMicMuted(next);
    setMuted(next);
    socketRef.current?.emit("toggle_mic", { is_muted: next });
  };

  const handleSendReaction = (emoji: string) => {
    socketRef.current?.emit("send_reaction", { emoji });
  };

  const handleCopyLink = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveRoom = async () => {
    if (isHost) {
      const ok = await confirm({
        title: "END ROOM",
        message: "END ROOM FOR EVERYONE? THIS CANNOT BE UNDONE.",
        variant: "danger",
        confirmLabel: "END ROOM",
        cancelLabel: "CANCEL",
      });
      if (ok) {
        const socket = getSocket(token!, roomId!);
        socket?.emit("end_room", {});
        cleanupAndLeave();
      }
    } else {
      cleanupAndLeave();
    }
  };

  if (!mounted || !isAuthenticated() || !roomId) return null;

  if (loading) {
    return (
      <div
        className="min-h-screen-dvh flex items-center justify-center"
        style={{
          background: "var(--bg)",
          color: "var(--ink)",
          padding: "24px",
        }}
      >
        <div className="card" style={{ maxWidth: "420px", width: "100%", textAlign: "center", padding: "32px 24px" }}>
          <div style={{
            background: "var(--ink)",
            color: "var(--accent-alt)",
            border: "var(--border)",
            padding: "16px",
            fontSize: "14px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            marginBottom: "16px",
          }}>
            LOADING ROOM...<span className="cursor-blink">_</span>
          </div>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--muted)" }}>
            CONNECTING TO AUDIO & QUEUE…
          </p>
        </div>
      </div>
    );
  }

  // Explicit calculation for mobile chat height
  // Chat pane height on mobile = 100dvh - header (56px) - player - tabbar (52px)
  const mobileEffectivePlayerHeight = (isLandscapePhone && mobileTab !== "player") ? 0 : playerHeight;
  const mobileChatExplicitHeight = `calc(100dvh - 56px - var(--safe-top) - ${mobileEffectivePlayerHeight}px - 52px - var(--safe-bottom))`;

  return (
    <div
      className="h-screen-dvh flex flex-col overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      {/* ── TOP HEADER (56px) ── */}
      <header style={{
        minHeight: "56px",
        height: "56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "var(--safe-top)",
        paddingBottom: "0px",
        paddingLeft: "calc(16px + var(--safe-left))",
        paddingRight: "calc(16px + var(--safe-right))",
        borderBottom: "var(--border)",
        background: "var(--ink)",
        color: "var(--ink-light)",
        zIndex: 25,
        flexShrink: 0,
        gap: "8px",
      }}>
        {/* Left: Brand + Room Name + Codes */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="Tune Together"
            width={100}
            height={36}
            priority
            className="logo-glow-dark hidden sm:block"
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 2.5vw, 16px)",
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {roomName || "LISTENING ROOM"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "1px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted-light)", fontFamily: "var(--font-mono)" }}>CODE:</span>
              <code style={{
                background: "var(--accent-alt)",
                color: "#0A0A0A",
                border: "1px solid #0A0A0A",
                padding: "1px 5px",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-mono)",
              }}>
                {inviteCode || "—"}
              </code>
              {inviteCode && (
                <div className="hidden sm:flex gap-1">
                  <button
                    onClick={handleCopyCode}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 6px", fontSize: "10px", height: "auto", minHeight: "28px" }}
                    title="COPY INVITE CODE"
                  >
                    {copiedCode ? "COPIED" : "COPY CODE"}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-primary btn-sm"
                    style={{ padding: "2px 8px", fontSize: "10px", height: "auto", minHeight: "28px" }}
                    title="COPY DIRECT JOIN LINK"
                  >
                    {copiedLink ? "LINK COPIED" : "COPY LINK"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Tablet Only: Drawer Toggle (768px – 1023px) */}
          <button
            onClick={() => setMemberDrawerOpen(!memberDrawerOpen)}
            className="btn btn-secondary btn-sm tablet-only"
            style={{ minHeight: "44px", padding: "6px 12px", fontSize: "11px", alignItems: "center", gap: "6px" }}
            id="tablet-members-btn"
            title="TOGGLE MEMBERS DRAWER"
          >
            <span>MEMBERS ({members.length})</span>
            <span style={{ fontSize: "13px" }}>☰</span>
          </button>

          {/* Quick Copy on Mobile Header */}
          {inviteCode && (
            <button
              onClick={handleCopyLink}
              className="btn btn-secondary btn-sm sm:hidden"
              style={{ minHeight: "44px", minWidth: "44px", padding: "6px", fontSize: "10px" }}
              title="COPY INVITE LINK"
            >
              {copiedLink ? "✓" : "LINK"}
            </button>
          )}

          {/* Leave/End Room Button */}
          <button
            onClick={handleLeaveRoom}
            className="btn btn-danger btn-sm"
            style={{ minHeight: "44px", minWidth: "44px", padding: "8px 14px", fontSize: "11px" }}
            id="room-leave-btn"
          >
            {isHost ? "END ROOM" : "LEAVE"}
          </button>
        </div>
      </header>

      {/* ── TABLET SLIDE-OVER DRAWER (768px – 1023px) ── */}
      {memberDrawerOpen && (
        <>
          <div
            onClick={() => setMemberDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10, 10, 10, 0.75)",
              zIndex: 90,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              left: 0,
              width: "300px",
              maxWidth: "85vw",
              zIndex: 95,
              background: "var(--surface)",
              borderRight: "var(--border)",
              boxShadow: "var(--shadow-hard-lg)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MemberList isDrawer={true} onClose={() => setMemberDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* ── DESKTOP & TABLET LAYOUT (≥ 768px) ── */}
      <div className="desktop-tablet-flex flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Member List (Desktop ≥ 1024px only, 260px) */}
        <div className="desktop-only-block shrink-0" style={{ width: "260px", borderRight: "var(--border)" }}>
          <MemberList style={{ width: "260px" }} />
        </div>

        {/* Center Column: Player, Controls, Search */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "var(--bg)",
          borderRight: "var(--border)",
          overflow: "hidden",
        }}>
          {/* Mode Switch Bar */}
          <ModeSelector />

          {/* YouTube Search Bar */}
          {currentSong.mode === "youtube" && <MusicControls />}

          {/* Player Centered Zone */}
          <div style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: currentSong.mode === "screenshare" ? "#000000" : "var(--bg)",
            padding: "16px",
          }}>
            {isDesktopLayout && (currentSong.mode === "youtube" ? <YouTubePlayer /> : <ScreenShareViewer />)}
            {isDesktopLayout && <FloatingReactions />}
          </div>

          {/* Desktop/Tablet Bottom Control Bar */}
          <footer style={{
            height: "52px",
            padding: "0 20px",
            borderTop: "var(--border)",
            background: "var(--surface)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
            zIndex: 10,
          }}>
            {/* Mic toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={handleMuteToggle}
                className={`btn ${micMuted ? "btn-danger" : "btn-secondary"} btn-sm`}
                id="footer-mute"
                style={{ minHeight: "44px", padding: "6px 14px", fontSize: "11px" }}
              >
                {micMuted ? "MIC OFF" : "MIC ON"}
              </button>
              {micError && (
                <span style={{ fontSize: "11px", color: "var(--error)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  MIC ACCESS DENIED
                </span>
              )}
            </div>

            {/* Live Reaction Bar (Desktop / Tablet) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg)",
              padding: "4px 8px",
              border: "var(--border-thin)",
            }}>
              <span style={{ fontSize: "10px", color: "var(--ink)", marginRight: "4px", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
                REACT:
              </span>
              {REACTION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSendReaction(item.id)}
                  className="reaction-picker-btn"
                  title={`SEND ${item.label.toUpperCase()} REACTION`}
                  aria-label={`Send ${item.label} reaction`}
                  style={{ minWidth: "36px", minHeight: "36px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.label}
                    style={{
                      width: "22px",
                      height: "22px",
                      objectFit: "contain",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Queue flyout button & branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <QueuePanel />
              <span className="hidden xl:inline" style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--muted)" }}>
                TUNETOGETHER
              </span>
            </div>
          </footer>
        </div>

        {/* Right Column: Chat Panel (Fixed 300px) */}
        <div className="shrink-0" style={{ width: "300px" }}>
          <ChatPanel style={{ width: "300px" }} />
        </div>
      </div>

      {/* ── MOBILE LAYOUT (< 768px) ── */}
      <div className="mobile-only-flex flex-1 flex-col min-h-0 overflow-hidden relative">
        {/* Player Visual Anchor (Anchored at Top) */}
        {/* Landscape Phone (667x375): When a non-player tab is active, hide player entirely */}
        <div
          ref={playerContainerRef}
          className={mobileTab !== "player" ? "phone-landscape-hide" : ""}
          style={{
            display: (isLandscapePhone && mobileTab !== "player") ? "none" : "block",
            flexShrink: 0,
            background: currentSong.mode === "screenshare" ? "#000000" : "var(--bg)",
            borderBottom: "var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!isDesktopLayout && (currentSong.mode === "youtube" ? <YouTubePlayer /> : <ScreenShareViewer />)}
          {!isDesktopLayout && <FloatingReactions />}
        </div>

        {/* Active Tab Pane */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--bg)",
          }}
        >
          {/* TAB 1: PLAYER DETAILS & SEARCH */}
          {mobileTab === "player" && (
            <div className="scroll-contain flex-1 overflow-y-auto" style={{ paddingBottom: "16px" }}>
              <ModeSelector />
              {currentSong.mode === "youtube" && <MusicControls />}

              {/* Mobile Quick Controls Bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: "var(--border-thin)",
                background: "var(--surface)",
                gap: "8px",
              }}>
                <button
                  onClick={handleMuteToggle}
                  className={`btn ${micMuted ? "btn-danger" : "btn-secondary"} btn-sm`}
                  style={{ minHeight: "44px", padding: "6px 14px", fontSize: "11px" }}
                >
                  {micMuted ? "MIC OFF" : "MIC ON"}
                </button>

                {/* Single REACT Button for Mobile */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setReactionPopoverOpen(!reactionPopoverOpen)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      minHeight: "44px",
                      padding: "6px 14px",
                      fontSize: "11px",
                      background: reactionPopoverOpen ? "var(--accent-alt)" : undefined,
                    }}
                    id="mobile-react-btn"
                  >
                    REACT ⚡
                  </button>

                  {/* 5-Emoji Rectangular Popover (44x44 each) */}
                  {reactionPopoverOpen && (
                    <div
                      className="reaction-popover"
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        right: 0,
                        zIndex: 50,
                      }}
                    >
                      {REACTION_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleSendReaction(item.id);
                            setReactionPopoverOpen(false);
                          }}
                          className="reaction-popover-item"
                          title={`SEND ${item.label.toUpperCase()}`}
                          aria-label={`Send ${item.label}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.src}
                            alt={item.label}
                            style={{ width: "24px", height: "24px", objectFit: "contain" }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHAT (Explicit Height Formula: 100dvh - header - player - tabbar) */}
          {mobileTab === "chat" && (
            <div style={{ height: mobileChatExplicitHeight, display: "flex", flexDirection: "column" }}>
              <ChatPanel style={{ height: "100%" }} />
            </div>
          )}

          {/* TAB 3: MEMBERS */}
          {mobileTab === "members" && (
            <div style={{ flex: 1, minHeight: 0 }}>
              <MemberList style={{ width: "100%", height: "100%" }} />
            </div>
          )}

          {/* TAB 4: QUEUE (Full Pane Mode) */}
          {mobileTab === "queue" && (
            <div style={{ flex: 1, minHeight: 0 }}>
              <QueuePanel isPane={true} style={{ width: "100%", height: "100%" }} />
            </div>
          )}
        </div>

        {/* ── MOBILE BOTTOM CONTROLS & TAB BAR (< 768px) ── */}
        <div style={{
          flexShrink: 0,
          borderTop: "var(--border)",
          background: "var(--surface)",
          zIndex: 30,
        }}>
          {/* Reaction Popover for non-player tabs if opened */}
          {reactionPopoverOpen && mobileTab !== "player" && (
            <div
              className="reaction-popover"
              style={{
                position: "absolute",
                bottom: "calc(52px + var(--safe-bottom) + 8px)",
                right: "16px",
                zIndex: 50,
              }}
            >
              {REACTION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleSendReaction(item.id);
                    setReactionPopoverOpen(false);
                  }}
                  className="reaction-popover-item"
                  title={`SEND ${item.label.toUpperCase()}`}
                  aria-label={`Send ${item.label}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.label}
                    style={{ width: "24px", height: "24px", objectFit: "contain" }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Bottom Tab Bar with Safe Area Insets */}
          <nav
            style={{
              height: "calc(52px + var(--safe-bottom))",
              paddingBottom: "var(--safe-bottom)",
              paddingLeft: "calc(6px + var(--safe-left))",
              paddingRight: "calc(6px + var(--safe-right))",
              display: "flex",
              alignItems: "stretch",
              gap: "4px",
              background: "var(--surface)",
            }}
          >
            {/* Tab: PLAYER */}
            <button
              onClick={() => { setMobileTab("player"); setReactionPopoverOpen(false); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: "44px",
                padding: "4px 2px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                background: mobileTab === "player" ? "var(--accent-alt)" : "var(--bg)",
                color: "var(--ink)",
                border: "var(--border-thin)",
                boxShadow: mobileTab === "player" ? "var(--shadow-hard-sm)" : "none",
              }}
              id="tab-player"
            >
              PLAYER
            </button>

            {/* Tab: CHAT */}
            <button
              onClick={() => { setMobileTab("chat"); setReactionPopoverOpen(false); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: "44px",
                padding: "4px 2px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                background: mobileTab === "chat" ? "var(--accent-alt)" : "var(--bg)",
                color: "var(--ink)",
                border: "var(--border-thin)",
                boxShadow: mobileTab === "chat" ? "var(--shadow-hard-sm)" : "none",
              }}
              id="tab-chat"
            >
              CHAT{messages.length > 0 ? ` (${messages.length})` : ""}
            </button>

            {/* Tab: MEMBERS */}
            <button
              onClick={() => { setMobileTab("members"); setReactionPopoverOpen(false); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: "44px",
                padding: "4px 2px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                background: mobileTab === "members" ? "var(--accent-alt)" : "var(--bg)",
                color: "var(--ink)",
                border: "var(--border-thin)",
                boxShadow: mobileTab === "members" ? "var(--shadow-hard-sm)" : "none",
              }}
              id="tab-members"
            >
              MEMBERS ({members.length})
            </button>

            {/* Tab: QUEUE */}
            <button
              onClick={() => { setMobileTab("queue"); setReactionPopoverOpen(false); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: "44px",
                padding: "4px 2px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                background: mobileTab === "queue" ? "var(--accent-alt)" : "var(--bg)",
                color: "var(--ink)",
                border: "var(--border-thin)",
                boxShadow: mobileTab === "queue" ? "var(--shadow-hard-sm)" : "none",
              }}
              id="tab-queue"
            >
              QUEUE{queue.length > 0 ? ` (${queue.length})` : ""}
            </button>

            {/* Mobile Reaction quick button next to tabs */}
            <button
              onClick={() => setReactionPopoverOpen(!reactionPopoverOpen)}
              className="btn btn-sm"
              style={{
                width: "44px",
                minHeight: "44px",
                padding: "4px",
                fontSize: "14px",
                background: reactionPopoverOpen ? "var(--accent)" : "var(--bg)",
                color: reactionPopoverOpen ? "#FFFFFF" : "var(--ink)",
                border: "var(--border-thin)",
                flexShrink: 0,
              }}
              title="EMOJI REACTIONS"
              aria-label="Toggle emoji reactions"
            >
              ⚡
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen-dvh flex items-center justify-center"
        style={{
          background: "var(--bg)",
          color: "var(--ink)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>🌀</div>
          <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>LOADING ROOM...</p>
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
