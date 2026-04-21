import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer-instadm">
      <div className="container">
        <div className="row align-items-center gy-2">
          <div className="col-md-4 text-md-start text-center">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#38bdf8", fontSize: "1.1rem" }}>
              InstaDM
            </span>
          </div>
          <div className="col-md-4 text-center">
            <span>© {new Date().getFullYear()} InstaDM. All rights reserved.</span>
          </div>
          <div className="col-md-4 text-md-end text-center">
            <Link to="/pricing" className="me-3">Pricing</Link>
            <Link to="/help">Help Centre</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
