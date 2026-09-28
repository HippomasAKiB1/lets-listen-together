"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/home";
  const isInvite = redirect.includes("/invite") || redirect.includes("/room/join");

  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      setAuth(res.data.access_token, res.data.user_id, res.data.username);
      router.push(redirect);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 15%, rgba(139, 92, 246, 0.16) 0%, #08080C 75%)",
      padding: "24px",
      position: "relative",
    }}>
      {/* Decorative ambient light */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "360px",
        height: "360px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)",
        filter: "blur(70px)",
        pointerEvents: "none",
      }} />

      <div className="fade-in" style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 2 }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <Image
              src="/assets/app-logo-trans.png"
              alt="TuneTogether Logo"
              width={76}
              height={76}
              priority
              style={{ objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.4))" }}
            />
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em", marginTop: "12px" }}>
            TuneTogether
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
            Listen together. Feel the same beat.
          </p>
        </div>

        {/* Card */}
        <div className="card card-glow" style={{ padding: "34px 30px" }}>
          {isInvite && (
            <div style={{
              background: "rgba(139, 92, 246, 0.12)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "22px",
              fontSize: "13px",
              color: "#DDD6FE",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              lineHeight: "1.4",
            }}>
              <span style={{ fontSize: "18px" }}>👋</span>
              <span><strong>You were invited to a room!</strong> Sign in to join immediately.</span>
            </div>
          )}

          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "22px" }}>
            Sign In
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                Username
              </label>
              <input
                className="input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                required
                id="login-username"
              />
            </div>

            <div>
              <label className="label" style={{ display: "block", marginBottom: "8px" }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                id="login-password"
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="login-submit"
              style={{ width: "100%", marginTop: "8px", padding: "14px" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-secondary)", fontSize: "14px" }}>
            Don&apos;t have an account?{" "}
            <Link
              href={`/register${redirect !== "/home" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              style={{ color: "#C4B5FD", fontWeight: "600", textDecoration: "none" }}
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#08080C" }} />}>
      <LoginContent />
    </Suspense>
  );
}
