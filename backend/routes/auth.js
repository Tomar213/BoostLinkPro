const express  = require("express");
const passport = require("../config/passport");
const db       = require("../models/db");
const router   = express.Router();

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000";

// ── POST /auth/check-email ─────────────────────────────────────────────────
// Frontend calls this first with the entered email.
// Returns { exists: true/false }
// If exists → frontend calls POST /auth/login-direct to log the user in
// If not    → frontend redirects to Google OAuth
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    const rows = await db.queryAsync(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/login-direct ────────────────────────────────────────────────
// Called when email exists in DB — log user in directly via session
// (No password needed — identity already verified via Google when they
//  first signed up. This is a trusted returning-user fast-path.)
router.post("/login-direct", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    const rows = await db.queryAsync(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "User not found." });
    }
    const user = rows[0];

    // Log in the user via passport/session
    req.login(user, async (err) => {
      if (err) {
        console.error("[Login Direct] Session error:", err.message);
        return res.status(500).json({ error: "Session error." });
      }

      // Check if they have an IG account connected
      const igRows = await db.queryAsync(
        "SELECT id FROM instagram_accounts WHERE user_id = ? LIMIT 1",
        [user.id]
      );

      console.log(`[Auth] ✅ Direct login: ${user.email} (id=${user.id})`);
      res.json({
        success:           true,
        hasInstagram:      igRows.length > 0,
        user: {
          id:     user.id,
          name:   user.name,
          email:  user.email,
          avatar: user.avatar,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /auth/google ───────────────────────────────────────────────────────
// Called when email does NOT exist — new user goes through Google OAuth
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ── GET /auth/google/callback ──────────────────────────────────────────────
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND}/login?error=1` }),
  async (req, res) => {
    try {
      const rows = await db.queryAsync(
        "SELECT id FROM instagram_accounts WHERE user_id = ? LIMIT 1",
        [req.user.id]
      );
      if (rows.length > 0) {
        res.redirect(`${FRONTEND}/?auth=success`);
      } else {
        res.redirect(`${FRONTEND}/connect-instagram?auth=success`);
      }
    } catch (err) {
      console.error("[Auth callback]", err.message);
      res.redirect(`${FRONTEND}/?auth=success`);
    }
  }
);

// ── GET /auth/me ───────────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  if (!req.isAuthenticated()) return res.json({ user: null, instagramAccount: null });
  try {
    const igRows = await db.queryAsync(
      `SELECT ig_user_id, ig_username, ig_name, ig_avatar, ig_bio,
              ig_followers, ig_following, ig_media_count, ig_website,
              ig_account_type, page_id, page_name, connected_at
       FROM instagram_accounts WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );
    res.json({
      user: {
        id:     req.user.id,
        name:   req.user.name,
        email:  req.user.email,
        avatar: req.user.avatar,
      },
      instagramAccount: igRows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/logout ──────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

module.exports = router;