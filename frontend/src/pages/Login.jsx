import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Steps: "email" → "checking" → "logging_in" | "google"
export default function Login() {
  const { user, loading, fetchMe } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/";

  const urlParams = new URLSearchParams(location.search);
  const urlError  = urlParams.get("error");

  const [email,    setEmail]    = useState("");
  const [step,     setStep]     = useState("email");   // "email" | "checking" | "logging_in"
  const [error,    setError]    = useState(urlError ? "Google sign-in failed. Please try again." : null);

  // Already logged in — go home
  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, from, navigate]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleContinue = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setStep("checking");

    try {
      // Ask backend if this email is already in the database
      const { data } = await axios.post(
        "/auth/check-email",
        { email: trimmed },
        { withCredentials: true }
      );

      if (data.exists) {
        // ── Email found → log in directly without Google ──────────────
        setStep("logging_in");
        const loginRes = await axios.post(
          "/auth/login-direct",
          { email: trimmed },
          { withCredentials: true }
        );

        await fetchMe(); // refresh global auth state

        if (loginRes.data.hasInstagram) {
          navigate("/", { replace: true });
        } else {
          navigate("/connect-instagram", { replace: true });
        }
      } else {
        // ── Email not found → go to Google OAuth (new user) ───────────
        window.location.href = "http://localhost:5000/auth/google";
      }
    } catch (err) {
      setStep("email");
      setError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleContinue();
  };

  const isChecking = step === "checking" || step === "logging_in";

  return (
    <section className="auth-section">
      <div className="auth-card">

        {/* Icon + heading */}
        <div className="text-center mb-4">
          <div style={{
            width: 60, height: 60,
            background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.7rem", margin: "0 auto 1.2rem",
          }}>
            <i className="bi bi-instagram" style={{ color: "white" }}></i>
          </div>
          <h1 className="auth-title">Welcome to InstaDM</h1>
          <p className="text-muted mt-1" style={{ fontSize: "0.92rem" }}>
            Enter your email to sign in or create an account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger alert-custom mb-3" style={{ borderRadius: 12, fontSize: "0.88rem" }}>
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        {/* Email input */}
        <div className="mb-3">
          <label className="form-label-custom d-block">Email Address</label>
          <input
            className="form-control form-control-custom"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            disabled={isChecking}
            autoFocus
          />
        </div>

        {/* Continue button */}
        <button
          className="btn btn-submit w-100 mb-3"
          onClick={handleContinue}
          disabled={isChecking || !email.trim()}
          style={{ opacity: email.trim() ? 1 : 0.6 }}
        >
          {step === "checking" && (
            <><span className="spinner-border spinner-border-sm me-2" />Checking…</>
          )}
          {step === "logging_in" && (
            <><span className="spinner-border spinner-border-sm me-2" />Signing you in…</>
          )}
          {step === "email" && (
            <>Continue <i className="bi bi-arrow-right ms-2"></i></>
          )}
        </button>

        {/* Divider */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
            or sign in with
          </span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {/* Google button */}
        <button
          onClick={() => { window.location.href = "http://localhost:5000/auth/google"; }}
          disabled={isChecking}
          className="btn w-100 d-flex align-items-center justify-content-center gap-3"
          style={{
            border: "1.5px solid #e2e8f0", borderRadius: 14,
            padding: "0.75rem", fontWeight: 600, fontSize: "0.95rem",
            background: "white", cursor: "pointer", transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>

        {/* How it works hint */}
        <div className="mt-4 p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            <i className="bi bi-info-circle me-1 text-primary"></i>
            <strong>Returning user?</strong> Enter your email — you'll be signed in instantly.<br />
            <i className="bi bi-person-plus me-1 text-success"></i>
            <strong>New user?</strong> Enter your email and we'll set up your account via Google.
          </p>
        </div>

        <p className="text-center mt-3" style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
          By continuing, you agree to our{" "}
          <a href="#!" style={{ color: "#0ea5e9" }}>Terms</a> and{" "}
          <a href="#!" style={{ color: "#0ea5e9" }}>Privacy Policy</a>
        </p>
      </div>
    </section>
  );
}