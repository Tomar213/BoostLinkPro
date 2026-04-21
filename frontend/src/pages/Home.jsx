import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, igAccount } = useAuth();
  const navigate = useNavigate();

  const handleAutomateClick = (type) => {
    if (!user) {
      // Store intent so we resume after login
      sessionStorage.setItem("pendingAutomationType", type);
      navigate("/login");
      return;
    }
    sessionStorage.setItem("pendingAutomationType", type);
    navigate("/connect-instagram");
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="hero-badge fade-up">
            <i className="bi bi-instagram me-1"></i> Instagram DM Automation
          </div>
          <h1 className="hero-title fade-up delay-1">
            Turn Every DM &amp; Comment<br />
            into a <span className="highlight">Conversion</span>
          </h1>
          <p className="hero-sub fade-up delay-2">
            Automate your Instagram replies in seconds. Set a keyword, craft
            your message, and let InstaDM handle the rest — 24/7.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap fade-up delay-3">
            <button
              className="btn px-4 py-2"
              style={{ fontSize: "1rem", borderRadius: "50px", background: "white", color: "#0ea5e9", fontWeight: 700, border: "none" }}
              onClick={() => handleAutomateClick("dm")}
            >
              <i className="bi bi-chat-dots me-2"></i>AutoDM via Keyword
            </button>
            <button
              className="btn btn-nav-login px-4 py-2"
              style={{ fontSize: "1rem", borderRadius: "50px" }}
              onClick={() => handleAutomateClick("comment")}
            >
              <i className="bi bi-chat-square-text me-2"></i>AutoDM via Comment
            </button>
          </div>
          {!user && (
            <p className="fade-up delay-4 mt-3" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
              <i className="bi bi-lock me-1"></i>Sign in with Google to get started — it's free
            </p>
          )}
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="container">
          <div className="row justify-content-center">
            {[
              { num: "50K+", label: "Active Users" },
              { num: "2M+", label: "DMs Automated" },
              { num: "99.9%", label: "Uptime" },
              { num: "< 2s", label: "Response Time" },
            ].map((s) => (
              <div key={s.num} className="col-6 col-md-3 stat-item py-2">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="text-center mb-2">
            <div className="section-label">What We Offer</div>
          </div>
          <h2 className="section-title text-center">Two Powerful Automation Tools</h2>
          <p className="section-sub text-center">
            Everything you need to automate Instagram engagement — no coding required.
          </p>

          <div className="row g-4 justify-content-center">
            {/* Feature 1 */}
            <div className="col-12 col-md-6 col-lg-5">
              <div className="feature-card">
                <div className="feature-icon-wrap icon-wrap-blue">💬</div>
                <h3>AutoDM via Keyword</h3>
                <p>
                  When a user sends a specific keyword in your DMs, instantly
                  fire a personalised automated reply. Perfect for lead
                  capture, product info, giveaways, and more.
                </p>
                <div className="feature-tags">
                  <span className="tag tag-blue">Instant Reply</span>
                  <span className="tag tag-blue">Keyword Trigger</span>
                  <span className="tag tag-blue">24/7 Active</span>
                </div>
                <div className="p-3 rounded-3 mb-3" style={{ background: "#f0f9ff", border: "1px dashed #bae6fd" }}>
                  <div className="d-flex align-items-start gap-2" style={{ fontSize: "0.85rem" }}>
                    <span>👤</span>
                    <div>
                      <strong>User DMs:</strong> "INFO"<br />
                      <span className="text-muted">→ Auto-reply fires instantly</span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-feature btn-feature-blue" onClick={() => handleAutomateClick("dm")}>
                  <i className="bi bi-plus-circle me-2"></i>
                  {user ? "Set Up Keyword Automation" : "Get Started — It's Free"}
                </button>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-12 col-md-6 col-lg-5">
              <div className="feature-card">
                <div className="feature-icon-wrap icon-wrap-pink">🗨️</div>
                <h3>AutoDM via Comment</h3>
                <p>
                  When someone comments a trigger keyword on your post, they
                  automatically receive a DM. Great for viral giveaways,
                  exclusive links, and boosting engagement.
                </p>
                <div className="feature-tags">
                  <span className="tag tag-pink">Comment Trigger</span>
                  <span className="tag tag-pink">Viral Growth</span>
                  <span className="tag tag-pink">Post-Specific</span>
                </div>
                <div className="p-3 rounded-3 mb-3" style={{ background: "#fdf2f8", border: "1px dashed #f9a8d4" }}>
                  <div className="d-flex align-items-start gap-2" style={{ fontSize: "0.85rem" }}>
                    <span>👤</span>
                    <div>
                      <strong>Comment:</strong> "SEND LINK 🔥"<br />
                      <span className="text-muted">→ User receives a DM automatically</span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-feature btn-feature-pink" onClick={() => handleAutomateClick("comment")}>
                  <i className="bi bi-plus-circle me-2"></i>
                  {user ? "Set Up Comment Automation" : "Get Started — It's Free"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "white" }}>
        <div className="container">
          <div className="section-label text-center">Simple Setup</div>
          <h2 className="section-title text-center mb-5">Live in 3 Steps</h2>
          <div className="row g-4 text-center">
            {[
              { step: "01", icon: "🔑", title: "Sign In with Google", desc: "One click with your Google account — no password needed." },
              { step: "02", icon: "📸", title: "Connect Instagram", desc: "Link your Instagram Business account securely via Meta's official OAuth." },
              { step: "03", icon: "🚀", title: "Set Keywords & Go Live", desc: "Define trigger words and replies. InstaDM handles the rest 24/7." },
            ].map((s) => (
              <div key={s.step} className="col-12 col-md-4">
                <div className="p-4 rounded-4 h-100" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "2px", color: "#0ea5e9", marginBottom: "0.75rem" }}>
                    STEP {s.step}
                  </div>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{s.icon}</div>
                  <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>{s.title}</h4>
                  <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
