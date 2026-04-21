import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, igAccount, logout } = useAuth();
  const isActive   = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-instadm">
      <div className="container-fluid">
        <Link className="navbar-brand navbar-brand-text" to="/">BoostLink<span>Pro</span></Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain"
          style={{ border: "2px solid rgba(255,255,255,0.5)" }}>
          <span style={{ color: "white", fontSize: "1.2rem" }}><i className="bi bi-list"></i></span>
        </button>

        <div className="collapse navbar-collapse" id="navMain">
          <ul className="navbar-nav mx-auto gap-1">
            {["/", "/pricing", "/help"].map((path, i) => (
              <li className="nav-item" key={path}>
                <Link to={path} className={`nav-link nav-link-custom ${isActive(path) ? "active" : ""}`}>
                  {["Home", "Pricing", "Help Centre"][i]}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            {user ? (
              <>
                {igAccount && (
                  <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 6 }}>
                    {igAccount.ig_avatar
                      ? <img src={igAccount.ig_avatar} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid white" }} />
                      : <i className="bi bi-instagram"></i>}
                    @{igAccount.ig_username}
                  </span>
                )}
                <div className="d-flex align-items-center gap-1">
                  {user.avatar
                    ? <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid white" }} />
                    : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                        {user.name?.[0]}
                      </div>
                  }
                  <span style={{ color: "white", fontSize: "0.88rem", fontWeight: 600 }}>{user.name?.split(" ")[0]}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-nav-login" style={{ fontSize: "0.82rem" }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-nav-login">Log In</Link>
                <Link to="/login" className="btn btn-nav-signup">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
