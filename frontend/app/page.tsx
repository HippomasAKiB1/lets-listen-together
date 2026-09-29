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
    <div
      className="min-h-screen-dvh lg:h-screen-dvh flex flex-col overflow-y-auto lg:overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        border: "var(--border)",
      }}
    >
      {/* ── TOP NAV BAR ── */}
      <header style={{
        minHeight: "56px",
        height: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "var(--safe-top)",
        paddingBottom: "8px",
        paddingLeft: "calc(16px + var(--safe-left))",
        paddingRight: "calc(16px + var(--safe-right))",
        background: "var(--ink)",
        color: "var(--ink-light)",
        borderBottom: "var(--border)",
        flexShrink: 0,
        gap: "12px",
        flexWrap: "wrap",
      }}>
        {/* Left Brand Lockup */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="Tune Together"
            width={110}
            height={40}
            priority
            className="logo-glow-dark"
            style={{ height: "40px", width: "auto", objectFit: "contain" }}
          />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(15px, 3.5vw, 18px)",
            fontWeight: "900",
            letterSpacing: "0.02em",
            color: "#FFFFFF",
          }}>
            TUNE TOGETHER
          </span>
        </Link>

        {/* Right Auth Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {loggedIn ? (
            <>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-alt)", fontWeight: 700 }}>
                SIGNED IN AS {username}
              </span>
              <Link
                href="/home"
                className="btn btn-secondary"
                style={{ minHeight: "44px", padding: "8px 14px", fontSize: "11px" }}
                id="landing-home-btn"
              >
                DASHBOARD →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-ghost-dark"
                style={{ minHeight: "44px", padding: "8px 12px", fontSize: "11px" }}
                id="landing-login-btn"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ minHeight: "44px", padding: "8px 14px", fontSize: "11px" }}
                id="landing-register-btn"
              >
                GET STARTED
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT: DESKTOP 2-COLUMN GRID / MOBILE STACKED ── */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[1.08fr_0.92fr] min-h-0 lg:overflow-hidden">
        
        {/* LEFT COLUMN: EDITORIAL POSTER HERO */}
        <section style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(20px, 4vw, 36px) clamp(16px, 4vw, 32px)",
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
              gap: "8px",
              flexWrap: "wrap",
            }}>
              <span>SYNCHRONIZED AUDIO & VIDEO</span>
              <span style={{ color: "var(--accent)" }}>LIVE STREAMING</span>
            </div>

            {/* Transparent Hero Logo */}
            <div style={{ marginBottom: "16px" }}>
              <Image
                src="/assets/app-logo-trans.png"
                alt="Tune Together"
                width={240}
                height={88}
                priority
                className="logo-contrast-light"
                style={{ height: "clamp(64px, 10vw, 96px)", width: "auto", objectFit: "contain" }}
              />
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(28px, 5.5vw, 54px)",
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
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {loggedIn ? (
                <>
                  <Link
                    href="/room/create"
                    className="btn btn-primary btn-lg"
                    style={{ minHeight: "48px", textAlign: "center" }}
                    id="landing-create-cta"
                  >
                    CREATE ROOM →
                  </Link>
                  <Link
                    href="/room/join"
                    className="btn btn-outline btn-lg"
                    style={{ minHeight: "48px", textAlign: "center" }}
                    id="landing-join-cta"
                  >
                    JOIN ROOM
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="btn btn-primary btn-lg"
                    style={{ minHeight: "48px", textAlign: "center" }}
                    id="landing-get-started-cta"
                  >
                    GET STARTED →
                  </Link>
                  <Link
                    href="/room/join"
                    className="btn btn-outline btn-lg"
                    style={{ minHeight: "48px", textAlign: "center" }}
                    id="landing-join-cta"
                  >
                    JOIN A ROOM
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Bottom 3 Real Feature Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-light)] mt-4">
            <div style={{ padding: "10px 12px", borderRight: "var(--border-thin)", borderBottom: "var(--border-thin)" }}>
              <span style={{ fontSize: "10px", color: "var(--accent-alt)", display: "block" }}>PLAYBACK</span>
              <strong style={{ fontSize: "12px", display: "block", marginTop: "2px" }}>REAL-TIME SYNC</strong>
            </div>
            <div style={{ padding: "10px 12px", borderRight: "var(--border-thin)", borderBottom: "var(--border-thin)" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", display: "block" }}>AUDIO</span>
              <strong style={{ fontSize: "12px", display: "block", marginTop: "2px" }}>VOICE CHAT</strong>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent-alt)", display: "block" }}>PLAYLIST</span>
              <strong style={{ fontSize: "12px", display: "block", marginTop: "2px" }}>SHARED QUEUE</strong>
            </div>
          </div>
        </section>

        {/* MOBILE/TABLET: THIN HORIZONTAL ACCENT STRIP (~56px tall on <768px, ~72px on tablet) */}
        <div
          className="lg:hidden grid grid-cols-6 flex-shrink-0"
          style={{
            height: "clamp(56px, 8vw, 72px)",
            borderTop: "var(--border)",
            borderBottom: "var(--border)",
            background: "var(--ink)",
            gap: "2px",
          }}
        >
          {mosaicTiles.map((tile, i) => (
            <div
              key={`mobile-tile-${i}`}
              style={{
                background: tile.bg,
                width: "100%",
                height: "100%",
              }}
            />
          ))}
        </div>

        {/* DESKTOP (≥1024px): FLAT HARD-BORDERED PURE VISUAL COLOR MOSAIC GRID */}
        <section
          className="hidden lg:grid"
          style={{
            gridTemplateColumns: "1.1fr 0.9fr",
            gridTemplateRows: "1.2fr 0.8fr 1fr",
            background: "var(--ink)",
            gap: "2px",
            overflow: "hidden",
            height: "100%",
          }}
        >
          {mosaicTiles.map((tile, i) => (
            <div
              key={`desktop-tile-${i}`}
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
        minHeight: "36px",
        height: "auto",
        background: "var(--accent-alt)",
        color: "var(--ink)",
        borderTop: "var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "6px",
        paddingBottom: "calc(6px + var(--safe-bottom))",
        paddingLeft: "calc(16px + var(--safe-left))",
        paddingRight: "calc(16px + var(--safe-right))",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: "700",
        letterSpacing: "0.04em",
        flexShrink: 0,
        gap: "12px",
        flexWrap: "wrap",
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
