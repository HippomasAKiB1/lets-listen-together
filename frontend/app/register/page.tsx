"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/home";
  const isInvite = redirect.includes("/invite") || redirect.includes("/room/join");

  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("PASSWORDS DO NOT MATCH");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", { username, password });
      // Auto-login
      const loginRes = await api.post("/auth/login", { username, password });
      setAuth(loginRes.data.access_token, loginRes.data.user_id, loginRes.data.username);
      router.push(redirect);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "REGISTRATION FAILED. TRY AGAIN.");
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
        
        {/* Navigation back to landing */}
        <Link
          href="/"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: "16px", paddingLeft: 0, display: "inline-flex", gap: "6px" }}
          id="register-back-home"
        >
          <span>←</span> BACK TO HOME
        </Link>

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <Image
              src="/assets/app-logo-trans.png"
              alt="Tune Together"
              width={200}
              height={80}
              priority
              className="logo-contrast-light"
              style={{ height: "80px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1 style={{ fontSize: "28px", letterSpacing: "-0.03em" }}>
            TUNE TOGETHER
          </h1>
          <p style={{
            fontSize: "12px",
            color: "var(--muted)",
            marginTop: "4px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}>
            CREATE A NEW ACCOUNT
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
              CREATE ACCOUNT
            </h2>
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
              <span>INVITE DETECTED — CREATE ACCOUNT TO JOIN</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label" style={{ marginBottom: "6px" }}>
                USERNAME
              </label>
              <input
                className="input"
                type="text"
                placeholder="CHOOSE USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                id="register-username"
              />
            </div>

            <div>
              <label className="label" style={{ marginBottom: "6px" }}>
                PASSWORD
              </label>
              <input
                className="input"
                type="password"
                placeholder="AT LEAST 6 CHARACTERS"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="register-password"
              />
            </div>

            <div>
              <label className="label" style={{ marginBottom: "6px" }}>
                CONFIRM PASSWORD
              </label>
              <input
                className="input"
                type="password"
                placeholder="REPEAT PASSWORD"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                id="register-confirm"
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
              id="register-submit"
              style={{ width: "100%", marginTop: "6px", padding: "14px" }}
            >
              {loading ? "CREATING PROFILE…" : "CREATE ACCOUNT →"}
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
            HAVE AN ACCOUNT?{" "}
            <Link
              href={`/login${redirect !== "/home" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              style={{ color: "var(--accent)", textDecoration: "underline", marginLeft: "4px" }}
            >
              SIGN IN HERE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <RegisterContent />
    </Suspense>
  );
}
