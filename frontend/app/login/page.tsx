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
      setError(err?.response?.data?.detail || "LOGIN FAILED. CHECK CREDENTIALS.");
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
      background: "var(--bg)",
      padding: "24px",
      position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--ink)",
            border: "var(--border)",
            boxShadow: "var(--shadow-hard)",
            padding: "8px",
            marginBottom: "16px",
          }}>
            <Image
              src="/assets/app-logo-trans.png"
              alt="TUNETOGETHER LOGO"
              width={48}
              height={48}
              priority
              style={{ objectFit: "contain" }}
            />
          </div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.03em" }}>
            TUNETOGETHER
          </h1>
          <p style={{
            fontSize: "12px",
            color: "var(--muted)",
            marginTop: "4px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            AUTHENTICATION GATEWAY // SECURE SESSION
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px 28px" }}>
          
          {/* Top Bar inside card */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "var(--border)",
            paddingBottom: "12px",
            marginBottom: "20px",
          }}>
            <h2 style={{ fontSize: "18px", letterSpacing: "-0.02em" }}>
              SIGN IN
            </h2>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>
              [AUTH_REQ]
            </span>
          </div>

          {/* Invite Alert Strip */}
          {isInvite && (
            <div style={{
              background: "var(--accent-alt)",
              border: "var(--border)",
              boxShadow: "var(--shadow-hard-sm)",
              padding: "10px 12px",
              marginBottom: "20px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span>[!]</span>
              <span>INVITATION ACTIVE. SIGN IN TO ENTER ROOM.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label className="label" style={{ marginBottom: "6px" }}>
                USERNAME
              </label>
              <input
                className="input"
                type="text"
                placeholder="ENTER USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                required
                id="login-username"
              />
            </div>

            <div>
              <label className="label" style={{ marginBottom: "6px" }}>
                PASSWORD
              </label>
              <input
                className="input"
                type="password"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                id="login-password"
              />
            </div>

            {error && (
              <div style={{
                background: "#FFE5E5",
                border: "2px solid var(--error)",
                padding: "8px 12px",
                color: "var(--error)",
                fontSize: "12px",
                fontWeight: 700,
              }}>
                ERROR: {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="login-submit"
              style={{ width: "100%", marginTop: "6px", padding: "14px" }}
            >
              {loading ? "AUTHENTICATING…" : "SIGN IN [→]"}
            </button>
          </form>

          {/* Footer link */}
          <div style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "var(--border-thin)",
            textAlign: "center",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            NO ACCOUNT?{" "}
            <Link
              href={`/register${redirect !== "/home" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              style={{ color: "var(--accent)", textDecoration: "underline", marginLeft: "4px" }}
            >
              CREATE NEW ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <LoginContent />
    </Suspense>
  );
}
