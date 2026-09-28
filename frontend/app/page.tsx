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

  // Curated cultural mosaic elements (albums, concert films, cinema)
  const mosaicItems = [
    { title: "Blonde", subtitle: "Frank Ocean", tag: "Album", color: "#FDE047", bg: "linear-gradient(135deg, #1C1917, #44403C)" },
    { title: "After Hours", subtitle: "The Weeknd", tag: "Live Tour", color: "#EF4444", bg: "linear-gradient(135deg, #450A0A, #18181B)" },
    { title: "Dune: Part Two", subtitle: "Hans Zimmer OST", tag: "Cinema", color: "#F59E0B", bg: "linear-gradient(135deg, #78350F, #1C1917)" },
    { title: "Random Access Memories", subtitle: "Daft Punk", tag: "Vinyl", color: "#60A5FA", bg: "linear-gradient(135deg, #1E3A8A, #09090B)" },
    { title: "In Rainbows", subtitle: "Radiohead", tag: "Session", color: "#F43F5E", bg: "linear-gradient(135deg, #881337, #18181B)" },
    { title: "Interstellar Live", subtitle: "Royal Albert Hall", tag: "Concert", color: "#A78BFA", bg: "linear-gradient(135deg, #4C1D95, #0B0F19)" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080C",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",
      position: "relative",
    }}>
      
      {/* ── Ambient Background Lighting ── */}
      <div style={{
        position: "absolute",
        top: "-100px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "900px",
        height: "550px",
        background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.18) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 75%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Navigation Header ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        background: "rgba(8, 8, 12, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}>
        {/* Brand Logo & Name */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="TuneTogether Logo"
            width={40}
            height={40}
            priority
            style={{ objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(139,92,246,0.5))" }}
          />
          <span style={{
            fontSize: "20px",
            fontWeight: "800",
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
          }}>
            TuneTogether
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a href="#how-it-works" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "color 0.2s" }}>
            How it Works
          </a>
          <a href="#features" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "color 0.2s" }}>
            Features
          </a>
          <a href="#community" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "color 0.2s" }}>
            Community
          </a>
        </nav>

        {/* Auth CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {loggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Hi, <strong style={{ color: "#F8FAFC" }}>{username}</strong>
              </span>
              <Link href="/home" className="btn btn-primary btn-sm">
                Dashboard →
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section style={{
        position: "relative",
        zIndex: 1,
        padding: "80px 24px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: "1140px",
        margin: "0 auto",
      }}>
        {/* Subtle pill tag */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(139, 92, 246, 0.12)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          borderRadius: "99px",
          padding: "6px 16px",
          marginBottom: "28px",
          fontSize: "13px",
          color: "#DDD6FE",
          fontWeight: "500",
        }}>
          <span>✨</span>
          <span>Ultra-Low Latency Synchronized Music & Video</span>
        </div>

        {/* Hero Logo with glow */}
        <div style={{ marginBottom: "24px", position: "relative" }}>
          <div style={{
            position: "absolute",
            inset: "-20px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            filter: "blur(24px)",
            borderRadius: "50%",
            zIndex: -1,
          }} />
          <Image
            src="/assets/app-logo-trans.png"
            alt="TuneTogether Icon"
            width={100}
            height={100}
            priority
            style={{ objectFit: "contain", filter: "drop-shadow(0 12px 30px rgba(139,92,246,0.6))" }}
          />
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: "clamp(38px, 6vw, 68px)",
          fontWeight: "800",
          letterSpacing: "-0.03em",
          lineHeight: "1.1",
          marginBottom: "22px",
          maxWidth: "880px",
        }}>
          Listen together. Watch together. <br />
          <span className="text-gradient">Feel the exact same beat.</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          color: "var(--text-secondary)",
          lineHeight: "1.6",
          maxWidth: "680px",
          marginBottom: "40px",
        }}>
          Gather with your friends in private, synchronized audio-visual rooms. Stream YouTube, share queues, and speak over live low-latency voice without delay.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "center",
          marginBottom: "60px",
        }}>
          {loggedIn ? (
            <>
              <Link href="/room/create" className="btn btn-primary btn-lg" id="hero-create-cta">
                ➕ Create a Room
              </Link>
              <Link href="/room/join" className="btn btn-secondary btn-lg" id="hero-join-cta">
                🚪 Join with Code
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="btn btn-primary btn-lg" id="hero-get-started">
                Get Started Free →
              </Link>
              <Link href="/room/join" className="btn btn-secondary btn-lg" id="hero-join-cta">
                Join a Room
              </Link>
            </>
          )}
        </div>

        {/* ── Cultural Visual Mosaic / Collage ── */}
        <div style={{
          width: "100%",
          marginTop: "16px",
          padding: "24px",
          background: "rgba(18, 19, 28, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            padding: "0 8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="online-dot" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#A78BFA", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Now Playing Culture
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Shared Playlists & Live Listening Sessions
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "14px",
          }}>
            {mosaicItems.map((item, i) => (
              <div
                key={i}
                style={{
                  background: item.bg,
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "130px",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  position: "relative",
                  overflow: "hidden",
                  textAlign: "left",
                  transition: "transform 0.25s ease, border-color 0.25s ease",
                }}
              >
                {/* Vinyl groove circle effect */}
                <div style={{
                  position: "absolute",
                  right: "-20px",
                  bottom: "-20px",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "2px dashed rgba(255, 255, 255, 0.15)",
                  pointerEvents: "none",
                }} />

                <span style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: item.color,
                  letterSpacing: "0.06em",
                }}>
                  {item.tag}
                </span>

                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", marginBottom: "2px" }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features / How it works Section ── */}
      <section id="features" style={{
        position: "relative",
        zIndex: 1,
        padding: "80px 24px",
        maxWidth: "1140px",
        margin: "0 auto",
        width: "100%",
      }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <span className="label" style={{ color: "#A78BFA", marginBottom: "8px", display: "inline-block" }}>
            Engineered for Synced Moments
          </span>
          <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            How TuneTogether Works
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginTop: "8px", maxWidth: "600px", margin: "8px auto 0" }}>
            Simple, fast, and engineered with millisecond synchronization so you never lose the rhythm.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}>
          {/* Card 1 */}
          <div className="card card-glow" style={{ padding: "32px 28px" }}>
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "20px",
            }}>
              ⚡
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "10px" }}>
              1. Sub-Second Real-Time Sync
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
              Our smart drift-correction protocol constantly aligns audio timestamps across all connected guests without jarring skips or buffering loops.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card card-glow" style={{ padding: "32px 28px" }}>
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "rgba(236, 72, 153, 0.15)",
              border: "1px solid rgba(236, 72, 153, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "20px",
            }}>
              🎙️
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "10px" }}>
              2. Live Mesh Voice & Chat
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
              Direct peer-to-peer WebRTC voice mesh. Speak naturally with active speaker indicators, default mute safety, and floating instant reactions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card card-glow" style={{ padding: "32px 28px" }}>
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "20px",
            }}>
              🎶
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "10px" }}>
              3. Shared Queue & History
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
              Queue tracks together with YouTube integration. Automatic track transitions, previous track history, and dedicated host next/prev controls.
            </p>
          </div>
        </div>
      </section>

      {/* ── Community & Vibe Section ── */}
      <section id="community" style={{
        position: "relative",
        zIndex: 1,
        padding: "60px 24px 100px",
        maxWidth: "960px",
        margin: "0 auto",
        width: "100%",
        textAlign: "center",
      }}>
        <div className="card" style={{
          padding: "48px 36px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.18) 0%, rgba(15, 16, 24, 0.9) 70%)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
        }}>
          <span style={{ fontSize: "36px", marginBottom: "16px", display: "inline-block" }}>
            🎧
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "14px", letterSpacing: "-0.02em" }}>
            Made for Listening Parties & Film Nights
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto 32px" }}>
            Whether you&apos;re streaming a new album drop at midnight, studying with lo-fi beats, or watching concerts with your best friends across the world.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <Link href={loggedIn ? "/room/create" : "/register"} className="btn btn-primary btn-lg">
              {loggedIn ? "Start a Room Now" : "Join the Community Free"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Minimalist Footer ── */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "36px 40px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "18px",
        background: "rgba(8, 8, 12, 0.9)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="TuneTogether Logo"
            width={28}
            height={28}
            style={{ objectFit: "contain" }}
          />
          <span style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>
            TuneTogether
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            — Real-time synchronized audio rooms
          </span>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          © 2026 TuneTogether. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
