"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const { username, clearAuth, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div
      className="min-h-screen-dvh"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      {/* ── TOP HEADER ── */}
      <header style={{
        minHeight: "64px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "calc(10px + var(--safe-top))",
        paddingBottom: "10px",
        paddingLeft: "calc(16px + var(--safe-left))",
        paddingRight: "calc(16px + var(--safe-right))",
        background: "var(--ink)",
        color: "var(--ink-light)",
        borderBottom: "var(--border)",
        gap: "12px",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="Tune Together"
            width={120}
            height={44}
            priority
            className="logo-glow-dark"
            style={{ height: "42px", width: "auto", objectFit: "contain" }}
          />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(16px, 3.8vw, 22px)",
            fontWeight: "900",
            letterSpacing: "0.03em",
            color: "#FFFFFF",
          }}>
            TUNE TOGETHER
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--surface-dark)",
            border: "1px solid #333333",
            padding: "6px 10px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            minHeight: "36px",
          }}>
            <span className="online-dot" />
            <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {username}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ minHeight: "44px", padding: "8px 14px", fontSize: "11px" }}
            id="home-logout"
          >
            LOG OUT
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT GRID ── */}
      <main style={{
        flex: 1,
        paddingTop: "clamp(20px, 4vw, 36px)",
        paddingBottom: "calc(32px + var(--safe-bottom))",
        paddingLeft: "calc(16px + var(--safe-left))",
        paddingRight: "calc(16px + var(--safe-right))",
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}>
        
        {/* Hub Header Box */}
        <div style={{
          background: "var(--surface)",
          border: "var(--border)",
          boxShadow: "var(--shadow-hard)",
          padding: "clamp(16px, 4vw, 24px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <h1 style={{ fontSize: "clamp(22px, 4.5vw, 28px)", letterSpacing: "-0.03em", marginBottom: "4px" }}>
              ROOM DASHBOARD
            </h1>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--muted)" }}>
              SELECT AN ACTION TO CREATE OR JOIN A SYNCHRONIZED STREAM.
            </p>
          </div>
        </div>

        {/* ── ACTION GRID TILES (SOLID COLOR BLOCKS) ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
          gap: "20px",
        }}>
          
          {/* TILE 1: CREATE ROOM (SOLID ACCENT BLOCK) */}
          <div
            onClick={() => router.push("/room/create")}
            className="home-action-card"
            style={{
              background: "var(--accent)",
              color: "#FFFFFF",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard)",
              padding: "clamp(20px, 5vw, 32px)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "200px",
            }}
            id="home-create-room"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{
                background: "#0A0A0A",
                color: "#FFFFFF",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                padding: "3px 8px",
              }}>
                HOST
              </span>
              <span style={{ fontSize: "24px", fontWeight: 900 }}>➕</span>
            </div>

            <div>
              <h2 style={{ fontSize: "clamp(22px, 4.5vw, 28px)", letterSpacing: "-0.03em", marginBottom: "6px", color: "#FFFFFF" }}>
                CREATE ROOM
              </h2>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, opacity: 0.95, lineHeight: "1.4" }}>
                HOST A FRESH SYNCHRONIZED ROOM. FULL QUEUE CONTROL, WEBRTC VOICE CHAT & LIVE SHARING.
              </p>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              textDecoration: "underline",
              marginTop: "16px",
            }}>
              CREATE ROOM →
            </div>
          </div>

          {/* TILE 2: JOIN ROOM (SOLID ACID YELLOW BLOCK) */}
          <div
            onClick={() => router.push("/room/join")}
            className="home-action-card"
            style={{
              background: "var(--accent-alt)",
              color: "var(--ink)",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard)",
              padding: "clamp(20px, 5vw, 32px)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "200px",
            }}
            id="home-join-room"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{
                background: "#0A0A0A",
                color: "var(--accent-alt)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                padding: "3px 8px",
              }}>
                GUEST
              </span>
              <span style={{ fontSize: "24px", fontWeight: 900 }}>🚪</span>
            </div>

            <div>
              <h2 style={{ fontSize: "clamp(22px, 4.5vw, 28px)", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                JOIN ROOM
              </h2>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, opacity: 0.9, lineHeight: "1.4" }}>
                ENTER A 5-CHARACTER INVITATION CODE TO JOIN AN ACTIVE HOST SESSION.
              </p>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              textDecoration: "underline",
              marginTop: "16px",
            }}>
              JOIN ROOM →
            </div>
          </div>
        </div>

        {/* Informational Specs Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
          gap: "16px",
        }}>
          <div className="card" style={{ padding: "16px 20px" }}>
            <span className="label" style={{ marginBottom: "4px" }}>AUDIO SYNC</span>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", lineHeight: "1.4" }}>
              SUB-SECOND DRIFT CORRECTION KEEPS PLAYBACK SYNCHRONIZED FOR ALL MEMBERS.
            </p>
          </div>
          <div className="card" style={{ padding: "16px 20px" }}>
            <span className="label" style={{ marginBottom: "4px" }}>DEFAULT MIC MUTED</span>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", lineHeight: "1.4" }}>
              MICROPHONES INITIALIZE MUTED FOR PRIVACY. TOGGLE TO TALK WITH WEBRTC VOICE.
            </p>
          </div>
          <div className="card" style={{ padding: "16px 20px" }}>
            <span className="label" style={{ marginBottom: "4px" }}>SHARED QUEUE</span>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", lineHeight: "1.4" }}>
              TRACKS ADVANCE AUTOMATICALLY ONCE FINISHED. HOST HAS PREV AND NEXT CONTROLS.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
