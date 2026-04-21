import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Connect Instagram", "Set Keyword", "Set Reply", "Done"];

export default function ConnectInstagram() {
  const { user, igAccount, setIgAccount, fetchMe } = useAuth();
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [step, setStep] = useState(1);
  const [automationType, setAutomationType] = useState(null); // "dm" | "comment"

  // Form state
  const [keyword,        setKeyword]        = useState("");
  const [reply,          setReply]          = useState("");
  const [staticMsg,      setStaticMsg]      = useState("");
  const [postId,         setPostId]         = useState("");
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState(null);
  const [savedRule,      setSavedRule]      = useState(null);
  const [igError,        setIgError]        = useState(null);
  const [connecting,     setConnecting]     = useState(false);

  // Read URL params after IG OAuth redirect
  useEffect(() => {
    const igSuccess = params.get("ig_success");
    const igErr     = params.get("ig_error");
    const username  = params.get("username");

    if (igSuccess) {
      fetchMe().then(() => {
        setStep(2);
      });
    }
    if (igErr) {
      const msgs = {
        access_denied:           "You denied access. Please try again.",
        no_business_account:     "No Instagram Business account found. Make sure your account is a Business or Creator account linked to a Facebook Page.",
        token_exchange_failed:   "Connection failed. Please try again.",
      };
      setIgError(msgs[igErr] || "Instagram connection failed.");
    }

    // Check if automation type was stored before login redirect
    const stored = sessionStorage.getItem("pendingAutomationType");
    if (stored) {
      setAutomationType(stored);
      sessionStorage.removeItem("pendingAutomationType");
    }
  }, []);

  // If already have IG account, skip step 1
  useEffect(() => {
    if (igAccount && step === 1) setStep(2);
  }, [igAccount]);

  const handleConnectInstagram = () => {
    setConnecting(true);
    window.location.href = "http://localhost:5000/instagram/connect";
  };

  const handleSaveRule = async () => {
    if (!keyword.trim() || !reply.trim()) {
      setSaveError("Both keyword and reply message are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let res;
      if (automationType === "comment") {
        res = await axios.post("/api/automation/comment-rules",
          { keyword, dmMessage: reply, postId },
          { withCredentials: true }
        );
      } else {
        res = await axios.post("/api/automation/dm-rules",
          { keyword, response: reply, staticMessage: staticMsg },
          { withCredentials: true }
        );
      }
      setSavedRule(res.data.data);
      setStep(4);
    } catch (err) {
      setSaveError(err.response?.data?.error || "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <section style={{ minHeight: "calc(100vh - 70px)", background: "var(--surface)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "3rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--ink)" }}>
            {automationType === "comment" ? "AutoDM via Comment" : "AutoDM via Keyword"}
          </h2>
          <p className="text-muted" style={{ fontSize: "0.92rem" }}>
            {["Connect your account", "Choose your trigger keyword", "Write your automated reply", "You're live!"][step - 1]}
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            {STEPS.map((label, i) => (
              <div key={i} className="text-center" style={{ flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", margin: "0 auto 4px",
                  background: i + 1 < step ? "var(--sky-dark)" : i + 1 === step ? "var(--sky-dark)" : "#e2e8f0",
                  color: i + 1 <= step ? "white" : "#94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8rem", transition: "all 0.3s"
                }}>
                  {i + 1 < step ? <i className="bi bi-check-lg"></i> : i + 1}
                </div>
                <div style={{ fontSize: "0.7rem", color: i + 1 === step ? "var(--sky-dark)" : "#94a3b8", fontWeight: i + 1 === step ? 700 : 400 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 4, background: "#e2e8f0", borderRadius: 4 }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,var(--sky),var(--sky-dark))", borderRadius: 4, width: `${progressPct}%`, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 24, border: "1.5px solid var(--border)", padding: "2.5rem 2rem", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>

          {/* ── STEP 1: Connect Instagram ── */}
          {step === 1 && (
            <div className="text-center">
              <div style={{ width: 80, height: 80, background: "linear-gradient(135deg,#833ab4,#fd1d1d,#f77737)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", margin: "0 auto 1.5rem" }}>
                <i className="bi bi-instagram" style={{ color: "white" }}></i>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
                Connect Your Instagram
              </h3>
              <p className="text-muted mb-1" style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>
                We'll securely connect to your Instagram Business account via Meta's official API. You'll be redirected to Facebook to approve access.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap mt-3 mb-4">
                {["instagram_business_basic", "Manage Messages", "Manage Comments"].map(s => (
                  <span key={s} style={{ background: "#f0f9ff", color: "#0ea5e9", fontSize: "0.78rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: 50 }}>
                    <i className="bi bi-shield-check me-1"></i>{s}
                  </span>
                ))}
              </div>

              {igError && (
                <div className="alert alert-danger mb-3" style={{ borderRadius: 12, fontSize: "0.88rem" }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>{igError}
                </div>
              )}

              <button
                onClick={handleConnectInstagram}
                disabled={connecting}
                className="btn w-100"
                style={{ background: "linear-gradient(135deg,#833ab4,#fd1d1d,#f77737)", color: "white", border: "none", borderRadius: 50, padding: "0.85rem", fontWeight: 700, fontSize: "1rem" }}
              >
                {connecting
                  ? <><span className="spinner-border spinner-border-sm me-2" />Redirecting to Meta…</>
                  : <><i className="bi bi-instagram me-2"></i>Connect Instagram Account</>
                }
              </button>
              <p className="mt-3" style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                Requires an Instagram <strong>Business</strong> or <strong>Creator</strong> account linked to a Facebook Page.
              </p>
            </div>
          )}

          {/* ── STEP 2: Choose Keyword ── */}
          {step === 2 && (
            <div>
              {/* Show connected account */}
              {igAccount && (
                <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "0.85rem 1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 12 }}>
                  {igAccount.ig_avatar
                    ? <img src={igAccount.ig_avatar} alt="" style={{ width: 38, height: 38, borderRadius: "50%" }} />
                    : <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#f77737)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="bi bi-instagram" style={{ color: "white" }}></i>
                      </div>
                  }
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#15803d" }}>
                      <i className="bi bi-check-circle-fill me-2"></i>Connected: @{igAccount.ig_username}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#16a34a" }}>{igAccount.ig_name}</div>
                  </div>
                </div>
              )}

              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.4rem" }}>
                What's the trigger keyword?
              </h3>
              <p className="text-muted mb-4" style={{ fontSize: "0.88rem" }}>
                {automationType === "comment"
                  ? "When someone comments this word on your post, they'll receive an auto DM."
                  : "When someone sends this word in a DM, your automated reply fires instantly."}
              </p>

              <label className="form-label-custom d-block">Trigger Keyword</label>
              <input
                className="form-control form-control-custom mb-2"
                placeholder={automationType === "comment" ? 'e.g. "SEND", "LINK", "WANT"' : 'e.g. "INFO", "PRICE", "JOIN"'}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && keyword.trim() && setStep(3)}
              />
              <small className="text-muted d-block mb-4">
                Case-insensitive. You can use any word or phrase.
              </small>

              {automationType === "comment" && (
                <>
                  <label className="form-label-custom d-block">Specific Post ID <span className="text-muted fw-normal">(optional)</span></label>
                  <input
                    className="form-control form-control-custom mb-1"
                    placeholder="Leave blank to apply to all posts"
                    value={postId}
                    onChange={e => setPostId(e.target.value)}
                  />
                  <small className="text-muted d-block mb-4">Find Post ID in your Meta Business Suite.</small>
                </>
              )}

              <button
                className="btn btn-submit w-100"
                disabled={!keyword.trim()}
                onClick={() => setStep(3)}
                style={{ opacity: keyword.trim() ? 1 : 0.5 }}
              >
                Next: Write Your Reply <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          )}

          {/* ── STEP 3: Set Reply ── */}
          {step === 3 && (
            <div>
              <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 10 }}>
                <i className="bi bi-lightbulb-fill" style={{ color: "#0ea5e9" }}></i>
                <span>Trigger keyword: <strong>"{keyword}"</strong></span>
              </div>

              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.4rem" }}>
                What should we send them?
              </h3>
              <p className="text-muted mb-4" style={{ fontSize: "0.88rem" }}>
                This message will be automatically sent when the keyword is triggered.
              </p>

              <label className="form-label-custom d-block">Automated Reply Message</label>
              <textarea
                className="form-control form-control-custom mb-4"
                rows={4}
                placeholder="e.g. Hey! Thanks for your interest 👋 Here's the link you asked for: https://..."
                value={reply}
                onChange={e => setReply(e.target.value)}
              />

              {automationType !== "comment" && (
                <>
                  <label className="form-label-custom d-block">
                    Instant Acknowledgement <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <input
                    className="form-control form-control-custom mb-1"
                    placeholder='e.g. "Got it! Sending details now... 🚀"'
                    value={staticMsg}
                    onChange={e => setStaticMsg(e.target.value)}
                  />
                  <small className="text-muted d-block mb-4">
                    Sent immediately before your main reply — creates a more natural feel.
                  </small>
                </>
              )}

              {saveError && (
                <div className="alert alert-danger mb-3" style={{ borderRadius: 12, fontSize: "0.88rem" }}>
                  {saveError}
                </div>
              )}

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary" style={{ borderRadius: 50, padding: "0.6rem 1.2rem" }} onClick={() => setStep(2)}>
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button
                  className="btn btn-submit flex-fill"
                  disabled={saving || !reply.trim()}
                  onClick={handleSaveRule}
                  style={{ opacity: reply.trim() ? 1 : 0.5 }}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    : <><i className="bi bi-check2-circle me-2"></i>Activate Automation</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 4 && (
            <div className="text-center py-2">
              <div style={{ width: 80, height: 80, background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", margin: "0 auto 1.5rem", animation: "fadeUp 0.5s ease" }}>
                ✅
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem", color: "#15803d" }}>
                Automation is Live!
              </h3>
              <p className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
                {automationType === "comment"
                  ? `Anyone who comments "${savedRule?.keyword}" on your post will automatically receive your DM.`
                  : `Anyone who DMs you "${savedRule?.keyword}" will instantly get your automated reply.`}
              </p>

              {/* Summary card */}
              {savedRule && (
                <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "1.25rem", textAlign: "left", marginBottom: "1.5rem" }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 1 }}>Rule Summary</span>
                    <span style={{ fontSize: "0.78rem", background: "#dcfce7", color: "#16a34a", padding: "2px 10px", borderRadius: 50, fontWeight: 600 }}>Active</span>
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "#334155" }}>
                    <div className="mb-1"><strong>Trigger:</strong> "{savedRule.keyword}"</div>
                    <div className="mb-1"><strong>Reply:</strong> {savedRule.response || savedRule.dm_message}</div>
                    {savedRule.static_message && <div><strong>Quick reply:</strong> {savedRule.static_message}</div>}
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn flex-fill"
                  style={{ background: "#f0f9ff", color: "#0ea5e9", border: "1.5px solid #bae6fd", borderRadius: 50, fontWeight: 600, padding: "0.65rem" }}
                  onClick={() => { setStep(2); setKeyword(""); setReply(""); setStaticMsg(""); setSavedRule(null); }}
                >
                  <i className="bi bi-plus-circle me-2"></i>Add Another Rule
                </button>
                <button
                  className="btn btn-submit flex-fill"
                  onClick={() => navigate("/")}
                >
                  <i className="bi bi-house me-2"></i>Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        {step < 4 && (
          <p className="text-center mt-3" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Need help? <a href="/help" style={{ color: "#0ea5e9" }}>Visit our Help Centre</a>
          </p>
        )}
      </div>
    </section>
  );
}
