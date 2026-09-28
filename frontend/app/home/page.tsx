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
    router.push("/login");
  };

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      color: "var(--ink)",
    }}>
      {/* ── TOP HEADER ── */}
      <header style={{
        height: "56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        background: "var(--ink)",
        color: "var(--ink-light)",
        borderBottom: "var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="TuneTogether"
            width={96}
            height={36}
            priority
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: "900",
            letterSpacing: "0.02em",
            color: "#FFFFFF",
          }}>
            TUNETOGETHER
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--surface-dark)",
            border: "1px solid #333333",
            padding: "4px 10px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            <span className="online-dot" />
            <span>USER: {username}</span>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary btn-sm" id="home-logout">
            LOG OUT
          </button>
        </div>
      </header>

      {/* ── HORIZONTAL SUB-BAR ── */}
      <div className="section-bar">
        <span>ROOM SELECTION</span>
        <span>CHOOSE AN ACTION</span>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <main style={{
        flex: 1,
        padding: "40px 24px",
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}>
        
        {/* Hub Header Box */}
        <div style={{
          background: "var(--surface)",
          border: "var(--border)",
          boxShadow: "var(--shadow-hard)",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <h1 style={{ fontSize: "28px", letterSpacing: "-0.03em", marginBottom: "4px" }}>
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
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}>
          
          {/* TILE 1: CREATE ROOM (SOLID ACCENT BLOCK) */}
          <div
            onClick={() => router.push("/room/create")}
            style={{
              background: "var(--accent)",
              color: "#FFFFFF",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard-lg)",
              padding: "32px 28px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "220px",
              transition: "transform 80ms ease-out, box-shadow 80ms ease-out",
            }}
            id="home-create-room"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
              <h2 style={{ fontSize: "28px", letterSpacing: "-0.03em", marginBottom: "6px", color: "#FFFFFF" }}>
                CREATE ROOM
              </h2>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, opacity: 0.95 }}>
                HOST A FRESH SYNCHRONIZED ROOM. FULL QUEUE CONTROL, WEBRTC VOICE MESH & LIVE SHARING.
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
            }}>
              CREATE ROOM →
            </div>
          </div>

          {/* TILE 2: JOIN ROOM (SOLID ACID YELLOW BLOCK) */}
          <div
            onClick={() => router.push("/room/join")}
            style={{
              background: "var(--accent-alt)",
              color: "var(--ink)",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard-lg)",
              padding: "32px 28px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "220px",
              transition: "transform 80ms ease-out, box-shadow 80ms ease-out",
            }}
            id="home-join-room"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
              <h2 style={{ fontSize: "28px", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                JOIN ROOM
              </h2>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, opacity: 0.9 }}>
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
            }}>
              JOIN ROOM →
            </div>
          </div>
        </div>

        {/* Informational Specs Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}>
          <div className="card" style={{ padding: "16px 20px" }}>
            <span className="label" style={{ marginBottom: "4px" }}>AUDIO SYNC</span>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              SUB-SECOND DRIFT CORRECTION KEEPS PLAYBACK SYNCHRONIZED FOR ALL MEMBERS.
            </p>
          </div>
          <div className="card" style={{ padding: "16px 20px" }}>
            <span className="label" style={{ marginBottom: "4px" }}>DEFAULT MIC MUTED</span>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              MICROPHONES INITIALIZE MUTED FOR PRIVACY. TOGGLE TO TALK WITH WEBRTC VOICE.
            </p>
          </div>
          <div className="card" style={{ padding: "16px 20px" }}>
            <span className="label" style={{ marginBottom: "4px" }}>SHARED QUEUE</span>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              TRACKS ADVANCE AUTOMATICALLY ONCE FINISHED. HOST HAS PREV AND NEXT CONTROLS.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
