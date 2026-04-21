require("dotenv").config();
const express  = require("express");
const session  = require("express-session");
const cors     = require("cors");
const db       = require("./models/db");   // connects on require
const passport = require("./config/passport");

const app      = express();
const PORT     = process.env.PORT         || 5000;
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000";

// ── MySQL-backed session store (no extra packages needed) ─────────────────
class MySQLSessionStore extends session.Store {
  get(sid, cb) {
    db.query(
      "SELECT data, expires FROM sessions WHERE session_id = ?",
      [sid],
      (err, rows) => {
        if (err) return cb(err);
        if (!rows.length) return cb(null, null);
        if (rows[0].expires < Math.floor(Date.now() / 1000)) {
          this.destroy(sid, () => {});
          return cb(null, null);
        }
        try { cb(null, JSON.parse(rows[0].data)); }
        catch (e) { cb(e); }
      }
    );
  }

  set(sid, sess, cb) {
    const expires = Math.floor(
      (sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000
    );
    db.query(
      `INSERT INTO sessions (session_id, expires, data) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE expires = VALUES(expires), data = VALUES(data)`,
      [sid, expires, JSON.stringify(sess)],
      (err) => cb(err || null)
    );
  }

  destroy(sid, cb) {
    db.query(
      "DELETE FROM sessions WHERE session_id = ?",
      [sid],
      (err) => cb && cb(err || null)
    );
  }

  touch(sid, sess, cb) {
    const expires = Math.floor(
      (sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000
    );
    db.query(
      "UPDATE sessions SET expires = ? WHERE session_id = ?",
      [expires, sid],
      (err) => cb && cb(err || null)
    );
  }
}

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store:             new MySQLSessionStore(),
  secret:            process.env.SESSION_SECRET || "instadm-secret-change-me",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   false,
    httpOnly: true,
    maxAge:   7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/auth",           require("./routes/auth"));
app.use("/instagram",      require("./routes/instagram"));
app.use("/api/automation", require("./routes/automation"));
app.use("/webhook",        require("./routes/webhook"));

app.get("/", (req, res) =>
  res.json({ status: "InstaDM API ✅ running", db: "MySQL (createConnection)" })
);

app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend  → http://localhost:${PORT}`);
  console.log(`   Frontend → ${FRONTEND}\n`);
});
