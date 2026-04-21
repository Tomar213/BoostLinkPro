const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db             = require("../models/db");

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email    = profile.emails?.[0]?.value || "";
        const name     = profile.displayName         || "";
        const avatar   = profile.photos?.[0]?.value  || "";

        // Upsert user — insert or update if google_id already exists
        await db.queryAsync(
          `INSERT INTO users (google_id, email, name, avatar)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name       = VALUES(name),
             avatar     = VALUES(avatar),
             updated_at = NOW()`,
          [googleId, email, name, avatar]
        );

        const rows = await db.queryAsync(
          "SELECT * FROM users WHERE google_id = ?",
          [googleId]
        );

        if (!rows.length) return done(new Error("User not found after upsert"), null);

        console.log(`[Auth] ✅ Google login: ${email} (id=${rows[0].id})`);
        return done(null, rows[0]);
      } catch (err) {
        console.error("[Passport] Error:", err.message);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const rows = await db.queryAsync("SELECT * FROM users WHERE id = ?", [id]);
    done(null, rows[0] || false);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
