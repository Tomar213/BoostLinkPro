/**
 * Instagram OAuth Route
 *
 * Flow:
 *  1. GET /instagram/connect
 *       → Redirects to https://api.instagram.com/oauth/authorize
 *       → User sees Instagram login page → one-tap save → consent screen
 *
 *  2. GET /instagram/callback?code=...&state=...
 *       → Exchange code for short-lived token (via api.instagram.com)
 *       → Exchange short token for long-lived token (via graph.instagram.com)
 *       → Fetch IG profile fields (id, username, bio, followers, etc.)
 *       → Fetch IG media (posts) and store post_count
 *       → Fetch linked Facebook Page (needed for messaging API)
 *       → Upsert everything into instagram_accounts table
 *       → Redirect back to frontend with success/error
 *
 *  3. GET  /instagram/account   → return stored IG account for logged-in user
 *  4. GET  /instagram/posts     → return recent posts for logged-in user
 *  5. DELETE /instagram/account → disconnect
 */

const express             = require("express");
const axios               = require("axios");
const db                  = require("../models/db");
const { isAuthenticated } = require("../middleware/auth");
const router              = express.Router();

const APP_ID     = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const BACKEND    = process.env.BACKEND_URL   || "http://localhost:5000";
const FRONTEND   = process.env.FRONTEND_URL  || "http://localhost:3000";
const REDIRECT   = `${BACKEND}/instagram/callback`;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Build Instagram OAuth URL and redirect
// Uses https://api.instagram.com/oauth/authorize (Instagram's own login page)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/connect", isAuthenticated, (req, res) => {
  if (!APP_ID) {
    return res.status(500).json({
      error: "INSTAGRAM_APP_ID is not set in your .env file."
    });
  }

  // Scopes needed:
  //   instagram_business_basic          — profile, followers, media count
  //   instagram_business_manage_messages — send/receive DMs
  //   instagram_business_manage_comments — read/reply to comments
  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
  ].join(",");

  // Encode userId in state so we know which user to save the account against
  // after the callback (session may not be reliable across the redirect)
  const state = Buffer.from(String(req.user.id)).toString("base64");

  const authUrl =`https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=${scopes}`;
              //    https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1288685783199326&redirect_uri=https://dumping-lid-prong.ngrok-free.dev/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights
//const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1288685783199326&redirect_uri=https://dumping-lid-prong.ngrok-free.dev/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`
  console.log(`[IG Connect] User ${req.user.id} → Instagram login page`);
  res.redirect(authUrl);
  console.log(`res.redirect ho gya`);

});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Instagram redirects back here with ?code=...&state=...
// ─────────────────────────────────────────────────────────────────────────────
router.get("/callback", async (req, res) => {
  console.log("in call bacl here");
  const { code, state, error, error_reason, error_description } = req.query;

  // ── Handle denied / cancelled ──────────────────────────────────────────
  if (error || !code) {
    const reason = error_reason || error || "unknown";
    console.error(`[IG Callback] User denied access: ${reason}`);
    return res.redirect(
      `${FRONTEND}/connect-instagram?ig_error=access_denied&reason=${encodeURIComponent(reason)}`
    );
  }

  // Decode userId from state param
  let userId;
  try {
    userId = Buffer.from(state, "base64").toString("utf8");
    if (!userId || isNaN(Number(userId))) throw new Error("invalid state");
  } catch {
    console.error("[IG Callback] Invalid state param:", state);
    return res.redirect(`${FRONTEND}/connect-instagram?ig_error=invalid_state`);
  }

  try {
    // ── 1. Exchange code for short-lived access token ───────────────────
    // Must use POST to https://api.instagram.com/oauth/access_token
    const tokenForm = new URLSearchParams({
      client_id:     APP_ID,
      client_secret: APP_SECRET,
      grant_type:    "authorization_code",
      redirect_uri:  REDIRECT,
      code,
    });

    const { data: shortTokenData } = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      tokenForm.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // shortTokenData = { access_token, user_id }
    const shortToken = shortTokenData.access_token;
    const igUserId   = String(shortTokenData.user_id);
    console.log(`[IG Callback] Short-lived token obtained for IG user: ${igUserId}`);

    // ── 2. Exchange short token for long-lived token (60 days) ──────────
    // Uses graph.instagram.com
    const { data: longTokenData } = await axios.get(
      "https://graph.instagram.com/access_token",
      {
        params: {
          grant_type:        "ig_exchange_token",
          client_secret:     APP_SECRET,
          access_token:      shortToken,
        },
      }
    );

    const longToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in || 5183944; // ~60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000)
      .toISOString().slice(0, 19).replace("T", " ");

    console.log(`[IG Callback] Long-lived token obtained. Expires: ${expiresAt}`);

    // ── 3. Fetch Instagram Business profile ─────────────────────────────
    // graph.instagram.com/<ig_user_id>
    const profileFields = [
      "id",
      "username",
      "name",
      "profile_picture_url",
      "biography",
      "followers_count",
      "follows_count",
      "media_count",
      "website",
      "account_type",
    ].join(",");

    const { data: igProfile } = await axios.get(
      `https://graph.instagram.com/${igUserId}`,
      {
        params: {
          fields:       profileFields,
          access_token: longToken,
        },
      }
    );
    console.log(`[IG Callback] Profile fetched: @${igProfile.username}`);

    // ── 4. Fetch recent media (posts) — store up to 20 ──────────────────
    let mediaPosts = [];
    try {
      const { data: mediaData } = await axios.get(
        `https://graph.instagram.com/${igUserId}/media`,
        {
          params: {
            fields:       "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
            access_token: longToken,
            limit:        20,
          },
        }
      );
      mediaPosts = mediaData.data || [];
      console.log(`[IG Callback] Fetched ${mediaPosts.length} media posts.`);
    } catch (mediaErr) {
      // Non-fatal — media fetch can fail if no posts exist
      console.warn("[IG Callback] Media fetch failed (non-fatal):", mediaErr.response?.data?.error?.message || mediaErr.message);
    }

    // ── 5. Fetch linked Facebook Page (needed for Messaging API) ─────────
    // The Graph API (facebook.com) still requires a Page token to send DMs
    let pageId   = null;
    let pageName = null;
    let pageToken = longToken; // fallback

    try {
      // Use the long-lived IG token to get associated FB pages
      const { data: pagesData } = await axios.get(
        "https://graph.facebook.com/v21.0/me/accounts",
        {
          params: {
            access_token: longToken,
            fields:       "id,name,access_token,instagram_business_account",
          },
        }
      );

      const pages      = pagesData.data || [];
      const pageWithIG = pages.find(
        (p) => p.instagram_business_account?.id === igUserId
      ) || pages[0]; // fallback to first page if ID doesn't match exactly

      if (pageWithIG) {
        pageId    = pageWithIG.id;
        pageName  = pageWithIG.name || null;
        pageToken = pageWithIG.access_token || longToken;
        console.log(`[IG Callback] Linked FB Page: "${pageName}" (${pageId})`);
      } else {
        console.warn("[IG Callback] No linked Facebook Page found — DM sending may be limited.");
      }
    } catch (pageErr) {
      console.warn("[IG Callback] FB Page fetch failed (non-fatal):", pageErr.response?.data?.error?.message || pageErr.message);
    }

    // ── 6. Upsert instagram_accounts in DB ───────────────────────────────
    await db.queryAsync(
      `INSERT INTO instagram_accounts
         (user_id, ig_user_id, ig_username, ig_name, ig_avatar, ig_bio,
          ig_followers, ig_following, ig_media_count, ig_website, ig_account_type,
          access_token, token_expires_at, page_id, page_name)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         ig_username      = VALUES(ig_username),
         ig_name          = VALUES(ig_name),
         ig_avatar        = VALUES(ig_avatar),
         ig_bio           = VALUES(ig_bio),
         ig_followers     = VALUES(ig_followers),
         ig_following     = VALUES(ig_following),
         ig_media_count   = VALUES(ig_media_count),
         ig_website       = VALUES(ig_website),
         ig_account_type  = VALUES(ig_account_type),
         access_token     = VALUES(access_token),
         token_expires_at = VALUES(token_expires_at),
         page_id          = VALUES(page_id),
         page_name        = VALUES(page_name),
         updated_at       = NOW()`,
      [
        userId,
        igUserId,
        igProfile.username           || null,
        igProfile.name               || null,
        igProfile.profile_picture_url || null,
        igProfile.biography          || null,
        igProfile.followers_count    || 0,
        igProfile.follows_count      || 0,
        igProfile.media_count        || 0,
        igProfile.website            || null,
        igProfile.account_type       || null,
        pageToken,
        expiresAt,
        pageId,
        pageName,
      ]
    );

    // ── 7. Save posts to ig_posts table ───────────────────────────────────
    if (mediaPosts.length > 0) {
      // Make sure ig_posts table exists
      await db.queryAsync(`
        CREATE TABLE IF NOT EXISTS ig_posts (
          id             INT AUTO_INCREMENT PRIMARY KEY,
          user_id        INT NOT NULL,
          ig_account_id  INT NOT NULL,
          post_id        VARCHAR(100) NOT NULL UNIQUE,
          caption        TEXT,
          media_type     VARCHAR(50),
          media_url      TEXT,
          thumbnail_url  TEXT,
          permalink      VARCHAR(500),
          like_count     INT DEFAULT 0,
          comments_count INT DEFAULT 0,
          posted_at      DATETIME,
          fetched_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id)       REFERENCES users(id)               ON DELETE CASCADE,
          FOREIGN KEY (ig_account_id) REFERENCES instagram_accounts(id)  ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // Get the instagram_accounts row id we just upserted
      const [igRow] = await db.queryAsync(
        "SELECT id FROM instagram_accounts WHERE user_id = ? AND ig_user_id = ? LIMIT 1",
        [userId, igUserId]
      );

      for (const post of mediaPosts) {
        try {
          await db.queryAsync(
            `INSERT INTO ig_posts
               (user_id, ig_account_id, post_id, caption, media_type, media_url,
                thumbnail_url, permalink, like_count, comments_count, posted_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               caption        = VALUES(caption),
               media_url      = VALUES(media_url),
               thumbnail_url  = VALUES(thumbnail_url),
               like_count     = VALUES(like_count),
               comments_count = VALUES(comments_count),
               fetched_at     = NOW()`,
            [
              userId,
              igRow.id,
              post.id,
              post.caption       || null,
              post.media_type    || null,
              post.media_url     || null,
              post.thumbnail_url || null,
              post.permalink     || null,
              post.like_count    || 0,
              post.comments_count || 0,
              post.timestamp
                ? new Date(post.timestamp).toISOString().slice(0, 19).replace("T", " ")
                : null,
            ]
          );
        } catch (postErr) {
          console.warn(`[IG Callback] Skipped post ${post.id}:`, postErr.message);
        }
      }
      console.log(`[IG Callback] ✅ ${mediaPosts.length} posts saved to ig_posts table.`);
    }

    console.log(`[IG Callback] ✅ Instagram account @${igProfile.username} saved for user ${userId}`);
    res.redirect(
      `${FRONTEND}/connect-instagram?ig_success=1&username=${encodeURIComponent(igProfile.username)}`
    );

  } catch (err) {
    const apiError = err.response?.data?.error || err.response?.data || err.message;
    console.error("[IG Callback] ❌ Fatal error:", JSON.stringify(apiError));

    // Give frontend a helpful error code
    let errorCode = "server_error";
    if (typeof apiError === "object") {
      const msg = apiError.message || "";
      if (msg.includes("code")) errorCode = "invalid_code";
      else if (msg.includes("token")) errorCode = "token_error";
      else if (msg.includes("permission")) errorCode = "permission_error";
    }

    res.redirect(`${FRONTEND}/connect-instagram?ig_error=${errorCode}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /instagram/account — return saved IG account for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
router.get("/account", isAuthenticated, async (req, res) => {
  try {
    const rows = await db.queryAsync(
      `SELECT ig_user_id, ig_username, ig_name, ig_avatar, ig_bio,
              ig_followers, ig_following, ig_media_count, ig_website,
              ig_account_type, page_id, page_name, connected_at, updated_at
       FROM instagram_accounts WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );
    res.json({ account: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /instagram/posts — return saved posts for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
router.get("/posts", isAuthenticated, async (req, res) => {
  try {
    const posts = await db.queryAsync(
      `SELECT post_id, caption, media_type, media_url, thumbnail_url,
              permalink, like_count, comments_count, posted_at
       FROM ig_posts
       WHERE user_id = ?
       ORDER BY posted_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: posts });
  } catch (err) {
    // ig_posts table might not exist yet if user never connected
    res.json({ success: true, data: [] });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /instagram/refresh-posts — re-fetch latest posts from Instagram API
// ─────────────────────────────────────────────────────────────────────────────
router.post("/refresh-posts", isAuthenticated, async (req, res) => {
  try {
    const igRows = await db.queryAsync(
      "SELECT * FROM instagram_accounts WHERE user_id = ? LIMIT 1",
      [req.user.id]
    );
    if (!igRows.length) {
      return res.status(400).json({ error: "No Instagram account connected." });
    }
    const ig = igRows[0];

    const { data: mediaData } = await axios.get(
      `https://graph.instagram.com/${ig.ig_user_id}/media`,
      {
        params: {
          fields:       "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
          access_token: ig.access_token,
          limit:        20,
        },
      }
    );

    const posts = mediaData.data || [];
    for (const post of posts) {
      await db.queryAsync(
        `INSERT INTO ig_posts
           (user_id, ig_account_id, post_id, caption, media_type, media_url,
            thumbnail_url, permalink, like_count, comments_count, posted_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           caption        = VALUES(caption),
           media_url      = VALUES(media_url),
           like_count     = VALUES(like_count),
           comments_count = VALUES(comments_count),
           fetched_at     = NOW()`,
        [
          req.user.id,
          ig.id,
          post.id,
          post.caption        || null,
          post.media_type     || null,
          post.media_url      || null,
          post.thumbnail_url  || null,
          post.permalink      || null,
          post.like_count     || 0,
          post.comments_count || 0,
          post.timestamp
            ? new Date(post.timestamp).toISOString().slice(0, 19).replace("T", " ")
            : null,
        ]
      );
    }

    res.json({ success: true, fetched: posts.length });
  } catch (err) {
    console.error("[Refresh Posts]", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /instagram/account — disconnect and remove all IG data
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/account", isAuthenticated, async (req, res) => {
  try {
    // Posts are deleted via CASCADE from ig_posts FK on ig_account_id
    await db.queryAsync(
      "DELETE FROM instagram_accounts WHERE user_id = ?",
      [req.user.id]
    );
    console.log(`[IG] User ${req.user.id} disconnected Instagram account.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
