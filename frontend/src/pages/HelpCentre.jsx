import React, { useState } from "react";

const faqs = [
  {
    q: "How does the keyword DM automation work?",
    a: "When a user sends a message to your Instagram inbox that contains your trigger keyword, InstaDM automatically sends your pre-configured reply within seconds. This works via the Instagram Messaging API through Meta's Graph API.",
  },
  {
    q: "How does the comment-to-DM automation work?",
    a: "InstaDM uses webhooks to listen for new comments on your Instagram posts. When a comment contains your trigger keyword, the commenter automatically receives a DM from your account. You can target all posts or a specific post by ID.",
  },
  {
    q: "What Instagram account type do I need?",
    a: "You need an Instagram Professional account (Business or Creator) connected to a Facebook Page. Personal accounts are not supported by the Instagram Graph API.",
  },
  {
    q: "How do I get my Instagram Access Token?",
    a: "Go to developers.facebook.com, create an app, add the Instagram Graph API product, connect your Instagram Business account, and generate a long-lived access token with instagram_manage_messages and instagram_manage_comments permissions.",
  },
  {
    q: "Where do I enter my Instagram API credentials?",
    a: "In the backend folder, copy the .env.example file to a new .env file and fill in your INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PAGE_ID, and VERIFY_TOKEN values before starting the server.",
  },
  {
    q: "How do I register the webhook with Meta?",
    a: "In your Meta Developer app settings, go to Webhooks and add your server URL (e.g. https://yourdomain.com/webhook) with your VERIFY_TOKEN. Subscribe to the 'messages' and 'comments' fields on the Instagram object.",
  },
  {
    q: "Can I set multiple keyword rules?",
    a: "Yes! You can create as many keyword rules as you need. Each rule has its own trigger word, auto-reply message, and optional static response.",
  },
  {
    q: "What happens if my server is offline?",
    a: "Meta will retry webhook deliveries for up to 24 hours. However, we recommend deploying on a reliable hosting platform (like Railway, Render, or AWS) to ensure 100% uptime.",
  },
];

export default function HelpCentre() {
  const [open, setOpen] = useState(null);

  return (
    <section className="help-section">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="section-label text-center">Help Centre</div>
        <h2 className="section-title text-center">Frequently Asked Questions</h2>
        <p className="section-sub text-center">
          Everything you need to know about setting up and using InstaDM.
        </p>

        <div>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="faq-item"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <i
                  className={`bi bi-chevron-${open === i ? "up" : "down"}`}
                  style={{ color: "#0ea5e9", flexShrink: 0, marginLeft: "1rem" }}
                ></i>
              </div>
              {open === i && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>

        <div
          className="text-center mt-5 p-4 rounded-4"
          style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd" }}
        >
          <h5 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
            Still have questions?
          </h5>
          <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
            Our support team is available Monday–Friday, 9am–6pm IST.
          </p>
          <a
            href="mailto:support@instadm.io"
            className="btn"
            style={{
              background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
              color: "white",
              borderRadius: "50px",
              fontWeight: 700,
              padding: "0.6rem 1.5rem",
            }}
          >
            <i className="bi bi-envelope me-2"></i>
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
