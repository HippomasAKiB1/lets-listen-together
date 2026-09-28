"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
      background: "#08080C",
      position: "relative",
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "350px",
        background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.14) 0%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 40px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        background: "rgba(10, 10, 14, 0.75)",
        backdropFilter: "blur(16px)",
        position: "relative",
        zIndex: 10,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <Image
            src="/assets/app-logo-trans.png"
            alt="TuneTogether Logo"
            width={38}
            height={38}
            priority
            style={{ objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(139,92,246,0.4))" }}
          />
          <span style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "-0.02em", color: "#FFFFFF" }}>
            TuneTogether
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            padding: "6px 14px",
            borderRadius: "99px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <span className="online-dot" />
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              Logged in as <strong style={{ color: "#F8FAFC" }}>{username}</strong>
            </span>
          </div>

          <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="home-logout">
            Log out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        zIndex: 2,
      }}>
        <div className="fade-in" style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Welcome to the Hub
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.5" }}>
              Create a fresh listening sanctuary or enter your friend&apos;s active room.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            {/* Create Room Button */}
            <button
              onClick={() => router.push("/room/create")}
              className="card card-glow"
              style={{
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                textAlign: "left",
                cursor: "pointer",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                background: "radial-gradient(circle at 10% 50%, rgba(139, 92, 246, 0.15) 0%, rgba(21, 22, 34, 0.8) 100%)",
              }}
              id="home-create-room"
            >
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
              }}>
                ➕
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#FFFFFF", marginBottom: "3px" }}>
                  Create Room
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Host a new synchronized session. You control the queue.
                </p>
              </div>
              <span style={{ fontSize: "20px", color: "#A78BFA" }}>→</span>
            </button>

            {/* Join Room Button */}
            <button
              onClick={() => router.push("/room/join")}
              className="card card-glow"
              style={{
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                textAlign: "left",
                cursor: "pointer",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(21, 22, 34, 0.75)",
              }}
              id="home-join-room"
            >
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
              }}>
                🚪
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#FFFFFF", marginBottom: "3px" }}>
                  Join Room
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Enter a 5-letter invite code or drop in with an invite link.
                </p>
              </div>
              <span style={{ fontSize: "20px", color: "var(--text-secondary)" }}>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
