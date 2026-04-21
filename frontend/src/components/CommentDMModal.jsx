import React, { useState } from "react";
import axios from "axios";

export default function CommentDMModal({ show, onClose }) {
  const [form, setForm] = useState({
    keyword: "",
    dmMessage: "",
    postId: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.dmMessage.trim()) {
      setStatus({ type: "error", msg: "Keyword and DM message are required." });
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/automation/comment-rules", form);
      setStatus({ type: "success", msg: "✅ Comment automation rule saved successfully!" });
      setForm({ keyword: "", dmMessage: "", postId: "" });
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
                  className="feature-icon-wrap icon-wrap-pink"
                  style={{ width: 40, height: 40, fontSize: "1.1rem", borderRadius: 12 }}
                >
                  💬
                </div>
                <span className="modal-title">AutoDM via Comment</span>
              </div>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                When someone comments a keyword on your post, they receive an auto DM.
              </p>
            </div>
            <button className="btn-close" onClick={onClose} style={{ marginTop: "0.2rem" }} />
          </div>

          {/* Body */}
          <div className="modal-body-custom">
            <form onSubmit={handleSubmit}>
              {/* Trigger keyword */}
              <div className="mb-3">
                <label className="form-label-custom d-block">
                  🎯 Trigger Keyword (in comment)
                </label>
                <input
                  className="form-control form-control-custom"
                  type="text"
                  name="keyword"
                  value={form.keyword}
                  onChange={handleChange}
                  placeholder='e.g. "WANT", "SEND", "LINK"'
                />
                <small className="text-muted">
                  If a comment contains this keyword, the commenter receives a DM automatically.
                </small>
              </div>

              {/* DM message to send */}
              <div className="mb-3">
                <label className="form-label-custom d-block">
                  📩 DM Message to Send
                </label>
                <textarea
                  className="form-control form-control-custom"
                  name="dmMessage"
                  rows={3}
                  value={form.dmMessage}
                  onChange={handleChange}
                  placeholder="e.g. Hey! Thanks for your interest. Here's your exclusive link: ..."
                />
              </div>

              {/* Optional Post ID */}
              <div className="mb-4">
                <label className="form-label-custom d-block">
                  📸 Instagram Post ID{" "}
                  <span className="text-muted fw-normal">(optional — leave blank for all posts)</span>
                </label>
                <input
                  className="form-control form-control-custom"
                  type="text"
                  name="postId"
                  value={form.postId}
                  onChange={handleChange}
                  placeholder="e.g. 17854360229135492"
                />
                <small className="text-muted">
                  Limit this rule to a specific post, or leave empty to apply to all posts.
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
                className="btn btn-submit btn-submit-pink"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving…
                  </>
                ) : (
                  "Save Comment Rule"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
