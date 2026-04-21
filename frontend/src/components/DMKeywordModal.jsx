import React, { useState } from "react";
import axios from "axios";

export default function DMKeywordModal({ show, onClose }) {
  const [form, setForm] = useState({
    keyword: "",
    response: "",
    staticMessage: "",
  });
  const [status, setStatus] = useState(null); // {type:'success'|'error', msg}
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.response.trim()) {
      setStatus({ type: "error", msg: "Trigger keyword and auto-reply message are required." });
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/automation/dm-rules", form);
      setStatus({ type: "success", msg: "✅ DM automation rule saved successfully!" });
      setForm({ keyword: "", response: "", staticMessage: "" });
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.error || "Failed to save rule. Is the backend running?",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block modal-custom"
      tabIndex="-1"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header-custom d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <div
                  className="feature-icon-wrap icon-wrap-blue"
                  style={{ width: 40, height: 40, fontSize: "1.1rem", borderRadius: 12 }}
                >
                  💬
                </div>
                <span className="modal-title">AutoDM via Keyword</span>
              </div>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                When someone DMs the trigger word, an automated reply is sent instantly.
              </p>
            </div>
            <button
              className="btn-close"
              onClick={onClose}
              style={{ marginTop: "0.2rem" }}
            />
          </div>

          {/* Body */}
          <div className="modal-body-custom">
            <form onSubmit={handleSubmit}>
              {/* Keyword */}
              <div className="mb-3">
                <label className="form-label-custom d-block">
                  🎯 Trigger Keyword
                </label>
                <input
                  className="form-control form-control-custom"
                  type="text"
                  name="keyword"
                  value={form.keyword}
                  onChange={handleChange}
                  placeholder='e.g. "INFO", "PRICE", "DISCOUNT"'
                />
                <small className="text-muted">
                  When this word appears in a DM, the automation fires.
                </small>
              </div>

              {/* Auto-reply message */}
              <div className="mb-3">
                <label className="form-label-custom d-block">
                  📤 Auto-Reply Message
                </label>
                <textarea
                  className="form-control form-control-custom"
                  name="response"
                  rows={3}
                  value={form.response}
                  onChange={handleChange}
                  placeholder="e.g. Thanks for reaching out! Here's the info you asked for: ..."
                />
              </div>

              {/* Static / instant response */}
              <div className="mb-4">
                <label className="form-label-custom d-block">
                  ⚡ Static Instant Response{" "}
                  <span className="text-muted fw-normal">(optional)</span>
                </label>
                <input
                  className="form-control form-control-custom"
                  type="text"
                  name="staticMessage"
                  value={form.staticMessage}
                  onChange={handleChange}
                  placeholder='e.g. "Got your message! Sending details now..."'
                />
                <small className="text-muted">
                  A quick acknowledgement sent immediately before the full reply.
                </small>
              </div>

              {status && (
                <div
                  className={`alert alert-custom ${
                    status.type === "success" ? "alert-success" : "alert-danger"
                  } mb-3`}
                >
                  {status.msg}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving…
                  </>
                ) : (
                  "Save Automation Rule"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
