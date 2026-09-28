"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function LandingPage() {
  const { isAuthenticated, username } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && isAuthenticated();

  const mosaicTiles = [
    { bg: "var(--accent-alt)" },
    { bg: "#0A0A0A" },
    { bg: "var(--accent)" },
    { bg: "#FFFFFF" },
    { bg: "var(--signal-blue)" },
    { bg: "#E8E4D9" },
  ];

  return (
    <div style={{
      height: "100dvh",
      maxHeight: "100dvh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      color: "var(--ink)",
      border: "var(--border)",
    }}>
      
      {/* ── TOP NAV BAR ── */}
      <header style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--ink)",
        color: "var(--ink-light)",
        borderBottom: "var(--border)",
        flexShrink: 0,
      }}>
        {/* Left Brand Lockup */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="Tune Together"
            width={120}
            height={44}
            priority
            className="logo-glow-dark"
            style={{ height: "44px", width: "auto", objectFit: "contain" }}
          />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: "900",
            letterSpacing: "0.02em",
            color: "#FFFFFF",
          }}>
            TUNE TOGETHER
          </span>
        </Link>

        {/* Right Auth Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {loggedIn ? (
            <>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-alt)", fontWeight: 700 }}>
                SIGNED IN AS {username}
              </span>
              <Link href="/home" className="btn btn-secondary btn-sm" id="landing-home-btn">
                DASHBOARD →
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost-dark btn-sm" id="landing-login-btn">
                SIGN IN
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm" id="landing-register-btn">
                GET STARTED
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── MAIN ONE-SCREEN CONTENT GRID ── */}
      <main style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1.08fr 0.92fr",
        minHeight: 0,
        overflow: "hidden",
      }}>
        
        {/* LEFT COLUMN: EDITORIAL POSTER HERO */}
        <section style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 32px",
          borderRight: "var(--border)",
          background: "var(--bg)",
          overflowY: "auto",
        }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "var(--border-thin)",
              paddingBottom: "8px",
              marginBottom: "16px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
            }}>
              <span>SYNCHRONIZED AUDIO & VIDEO</span>
              <span style={{ color: "var(--accent)" }}>LIVE STREAMING</span>
            </div>

            {/* Transparent Hero Logo */}
            <div style={{ marginBottom: "18px" }}>
              <Image
                src="/assets/app-logo-trans.png"
                alt="Tune Together"
                width={260}
                height={96}
                priority
                className="logo-contrast-light"
                style={{ height: "96px", width: "auto", objectFit: "contain" }}
              />
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(32px, 3.8vw, 54px)",
              lineHeight: "0.95",
              letterSpacing: "-0.04em",
              marginBottom: "16px",
              color: "var(--ink)",
            }}>
              LISTEN TOGETHER.<br />
              WATCH TOGETHER.<br />
              <span style={{ color: "var(--accent)" }}>
                IN REAL TIME.
              </span>
            </h1>

            {/* Plain Subheadline Card */}
            <div style={{
              background: "var(--surface)",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard-sm)",
              padding: "14px 16px",
              marginBottom: "20px",
            }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: "1.5",
                fontWeight: "700",
                color: "var(--ink)",
              }}>
                CREATE A ROOM WITH FRIENDS. SYNC YOUTUBE PLAYBACK DOWN TO THE MILLISECOND, TALK OVER LIVE VOICE, AND SHARE THE UP-NEXT QUEUE.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
              {loggedIn ? (
                <>
                  <Link href="/room/create" className="btn btn-primary btn-lg" id="landing-create-cta">
                    CREATE ROOM →
                  </Link>
                  <Link href="/room/join" className="btn btn-outline btn-lg" id="landing-join-cta">
                    JOIN ROOM
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary btn-lg" id="landing-get-started-cta">
                    GET STARTED →
                  </Link>
                  <Link href="/room/join" className="btn btn-outline btn-lg" id="landing-join-cta">
                    JOIN A ROOM
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Bottom 3 Real Feature Strips */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            border: "var(--border)",
            background: "var(--ink)",
            color: "var(--ink-light)",
          }}>
            <div style={{ padding: "10px 12px", borderRight: "var(--border-thin)" }}>
              <span style={{ fontSize: "10px", color: "var(--accent-alt)", display: "block" }}>PLAYBACK</span>
              <strong style={{ fontSize: "12px", display: "block", marginTop: "2px" }}>REAL-TIME SYNC</strong>
            </div>
            <div style={{ padding: "10px 12px", borderRight: "var(--border-thin)" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", display: "block" }}>AUDIO</span>
              <strong style={{ fontSize: "12px", display: "block", marginTop: "2px" }}>VOICE CHAT</strong>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent-alt)", display: "block" }}>PLAYLIST</span>
              <strong style={{ fontSize: "12px", display: "block", marginTop: "2px" }}>SHARED QUEUE</strong>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: FLAT HARD-BORDERED PURE VISUAL COLOR MOSAIC GRID (100% TEXT-FREE) */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gridTemplateRows: "1.2fr 0.8fr 1fr",
          background: "var(--ink)",
          gap: "2px",
          overflow: "hidden",
        }}>
          {mosaicTiles.map((tile, i) => (
            <div
              key={i}
              style={{
                background: tile.bg,
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            />
          ))}
        </section>
      </main>

      {/* ── BOTTOM STATIC FOOTER BAR ── */}
      <footer style={{
        height: "36px",
        background: "var(--accent-alt)",
        color: "var(--ink)",
        borderTop: "var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: "700",
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}>
        <span>TUNE TOGETHER · SYNCHRONIZED AUDIO & VIDEO</span>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>
            CRAFTED BY{" "}
            <a
              href="https://akibhasan.me"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--ink)",
                textDecoration: "none",
                fontWeight: 900,
                borderBottom: "2px solid var(--ink)",
                paddingBottom: "1px",
                transition: "all 100ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--ink)";
                e.currentTarget.style.color = "var(--accent-alt)";
                e.currentTarget.style.padding = "2px 6px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink)";
                e.currentTarget.style.padding = "0";
              }}
            >
              AKIB HASAN PYIL ↗
            </a>
          </span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
