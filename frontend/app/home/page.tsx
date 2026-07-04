"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const { username, clearAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (!isAuthenticated()) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, #0F0F0F 80%)",
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(15, 15, 15, 0.6)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🎵</span>
          <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em" }}>TuneTogether</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Logged in as <strong style={{ color: "var(--text-primary)" }}>{username}</strong>
          </span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}>
        <div className="fade-in" style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.03em" }}>
              Welcome back
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
              Create a new room or join an existing one to start listening.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            <button
              onClick={() => router.push("/room/create")}
              className="btn btn-primary"
              style={{ padding: "20px", fontSize: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "4px" }}
              id="home-create-room"
            >
              <span style={{ fontSize: "20px" }}>➕ Create Room</span>
              <span style={{ fontSize: "13px", fontWeight: "normal", opacity: 0.8 }}>Start a new session as the host</span>
            </button>

            <button
              onClick={() => router.push("/room/join")}
              className="btn btn-secondary"
              style={{ padding: "20px", fontSize: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "4px" }}
              id="home-join-room"
            >
              <span style={{ fontSize: "20px" }}>🚪 Join Room</span>
              <span style={{ fontSize: "13px", fontWeight: "normal", opacity: 0.8 }}>Enter an invite code from a friend</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
