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
    { tag: "VINYL", title: "DAFT PUNK", sub: "RANDOM ACCESS MEMORIES", bg: "var(--accent-alt)", color: "#0A0A0A" },
    { tag: "CONCERT", title: "THE WEEKND", sub: "AFTER HOURS AT SOFI", bg: "#0A0A0A", color: "#F2EFE6" },
    { tag: "SOUNDTRACK", title: "DUNE: PART TWO", sub: "HANS ZIMMER SCORE", bg: "var(--accent)", color: "#FFFFFF" },
    { tag: "SESSION", title: "RADIOHEAD", sub: "IN RAINBOWS BASEMENT", bg: "#FFFFFF", color: "#0A0A0A" },
    { tag: "LIVE", title: "INTERSTELLAR", sub: "ROYAL ALBERT HALL LIVE", bg: "var(--signal-blue)", color: "#FFFFFF" },
    { tag: "ALBUM", title: "BLONDE", sub: "FRANK OCEAN REISSUE", bg: "#E8E4D9", color: "#0A0A0A" },
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
              <Link href="/login" className="btn btn-ghost btn-sm" style={{ color: "#FFFFFF" }} id="landing-login-btn">
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
        gridTemplateColumns: "1.05fr 0.95fr",
        minHeight: 0,
        overflow: "hidden",
      }}>
        
        {/* LEFT COLUMN: EDITORIAL POSTER HERO */}
        <section style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "32px",
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
              marginBottom: "24px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
            }}>
              <span>SYNCHRONIZED AUDIO & VIDEO</span>
              <span style={{ color: "var(--accent)" }}>LIVE STREAMING</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(38px, 5vw, 64px)",
              lineHeight: "0.95",
              letterSpacing: "-0.04em",
              marginBottom: "20px",
              color: "var(--ink)",
            }}>
              LISTEN TOGETHER.<br />
              WATCH TOGETHER.<br />
              <span style={{ background: "var(--ink)", color: "var(--accent-alt)", padding: "0 6px" }}>
                IN REAL TIME.
              </span>
            </h1>

            {/* Plain Subheadline Card */}
            <div style={{
              background: "var(--surface)",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard-sm)",
              padding: "16px",
              marginBottom: "28px",
            }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                lineHeight: "1.5",
                fontWeight: "700",
                color: "var(--ink)",
              }}>
                CREATE A ROOM WITH FRIENDS. SYNC YOUTUBE PLAYBACK DOWN TO THE MILLISECOND, TALK OVER LIVE VOICE, AND SHARE THE UP-NEXT QUEUE.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
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

        {/* RIGHT COLUMN: FLAT HARD-BORDERED MOSAIC POSTER GRID */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "repeat(3, 1fr)",
          background: "var(--ink)",
          gap: "2px",
          overflow: "hidden",
        }}>
          {mosaicTiles.map((tile, i) => (
            <div
              key={i}
              style={{
                background: tile.bg,
                color: tile.color,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                border: "1px solid #0A0A0A",
              }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  border: "1px solid currentColor",
                  padding: "2px 6px",
                }}>
                  {tile.tag}
                </span>
              </div>

              <div>
                <h3 style={{
                  fontSize: "clamp(16px, 1.8vw, 22px)",
                  fontFamily: "var(--font-display)",
                  lineHeight: "1.05",
                  marginBottom: "4px",
                  letterSpacing: "-0.02em",
                }}>
                  {tile.title}
                </h3>
                <p style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  opacity: 0.9,
                }}>
                  {tile.sub}
                </p>
              </div>
            </div>
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
        <span>TUNETOGETHER · SYNCHRONIZED AUDIO & VIDEO ROOMS</span>
        <span>© 2026 ALL RIGHTS RESERVED</span>
      </footer>
    </div>
  );
}
