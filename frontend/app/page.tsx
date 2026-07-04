"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/home");
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
      background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, #0F0F0F 70%)",
      padding: "24px",
    }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "64px", height: "64px",
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            borderRadius: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "30px", margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
          }}>
            🎵
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            TuneTogether
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "15px" }}>
            Listen together. Feel the same beat.
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>
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
            <Link href="/register" style={{ color: "#A78BFA", fontWeight: "600", textDecoration: "none" }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
