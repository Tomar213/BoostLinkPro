import React from "react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "Forever free",
    features: [
      "3 Keyword DM Rules",
      "1 Comment Trigger Rule",
      "100 DMs / month",
      "Basic Analytics",
      "Community Support",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    price: "$19",
    period: "per month",
    features: [
      "Unlimited Keyword Rules",
      "Unlimited Comment Rules",
      "10,000 DMs / month",
      "Advanced Analytics",
      "Priority Support",
      "Webhook Access",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    features: [
      "Everything in Growth",
      "Unlimited DMs",
      "Multiple Instagram Accounts",
      "Team Members (5)",
      "Dedicated Support",
      "Custom Integrations",
    ],
    cta: "Go Pro",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section className="pricing-section">
      <div className="container">
        <div className="section-label text-center">Pricing</div>
        <h2 className="section-title text-center">Simple, Transparent Pricing</h2>
        <p className="section-sub text-center">
          No hidden fees. Start free and scale as you grow.
        </p>

        <div className="row g-4 justify-content-center">
          {plans.map((plan) => (
            <div className="col-12 col-md-4" key={plan.name}>
              <div className={`pricing-card position-relative ${plan.featured ? "featured" : ""}`}>
                {plan.featured && (
                  <div className="pricing-badge">Most Popular</div>
                )}
                <div
                  className="plan-name"
                  style={{ color: plan.featured ? "rgba(255,255,255,0.85)" : "#64748b" }}
                >
                  {plan.name}
                </div>
                <div
                  className="plan-price"
                  style={{ color: plan.featured ? "white" : "#0f172a" }}
                >
                  {plan.price}
                </div>
                <div className="plan-period">{plan.period}</div>

                <hr style={{ borderColor: plan.featured ? "rgba(255,255,255,0.2)" : "#e2e8f0" }} />

                <div className="mb-4">
                  {plan.features.map((f) => (
                    <div
                      key={f}
                      className="plan-feature"
                      style={{ color: plan.featured ? "rgba(255,255,255,0.9)" : "#334155" }}
                    >
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ color: plan.featured ? "#bae6fd" : "#0ea5e9", flexShrink: 0 }}
                      ></i>
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className="btn btn-feature w-100"
                  style={{
                    background: plan.featured
                      ? "white"
                      : "linear-gradient(135deg,#38bdf8,#0ea5e9)",
                    color: plan.featured ? "#0ea5e9" : "white",
                    borderRadius: "50px",
                    fontWeight: 700,
                    padding: "0.7rem",
                    textDecoration: "none",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-4 text-muted" style={{ fontSize: "0.9rem" }}>
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
