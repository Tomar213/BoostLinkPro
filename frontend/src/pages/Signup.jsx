import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    // Placeholder — wire up JWT registration endpoint
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <section className="auth-section">
        <div className="auth-card text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h2 className="auth-title mb-2">Account Created!</h2>
          <p className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
            Welcome to InstaDM. Connect your Instagram account to get started.
          </p>
          <Link
            to="/"
            className="btn btn-submit d-block"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            Go to Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div
            style={{
              width: 56, height: 56,
              background: "linear-gradient(135deg,#f472b6,#db2777)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.6rem", margin: "0 auto 1rem",
            }}
          >
            <i className="bi bi-instagram" style={{ color: "white" }}></i>
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="text-muted" style={{ fontSize: "0.92rem" }}>
            Start automating your Instagram DMs for free
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-custom d-block">Full Name</label>
            <input
              className="form-control form-control-custom"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
            />
          </div>

          <div className="mb-3">
            <label className="form-label-custom d-block">Email Address</label>
            <input
              className="form-control form-control-custom"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-3">
            <label className="form-label-custom d-block">Password</label>
            <input
              className="form-control form-control-custom"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
            />
          </div>

          <div className="mb-4">
            <label className="form-label-custom d-block">Confirm Password</label>
            <input
              className="form-control form-control-custom"
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="alert alert-custom alert-danger mb-3">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-submit btn-submit-pink"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Creating account…</>
            ) : (
              "Create Free Account"
            )}
          </button>
        </form>

        <p className="text-center mt-4" style={{ fontSize: "0.9rem", color: "#64748b" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0ea5e9", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>

        <p className="text-center mt-2" style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
          By signing up, you agree to our{" "}
          <a href="#!" style={{ color: "#0ea5e9" }}>Terms of Service</a> and{" "}
          <a href="#!" style={{ color: "#0ea5e9" }}>Privacy Policy</a>.
        </p>
      </div>
    </section>
  );
}
