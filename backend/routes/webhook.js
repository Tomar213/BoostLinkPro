const express          = require("express");
const router           = express.Router();
const db               = require("../models/db");
const instagramService = require("../services/instagramService");

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "instadm_verify";

// Webhook verification (GET)
router.get("/", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] ✅ Verified.");
    return res.status(200).send(challenge);
  }
  console.warn("[Webhook] ❌ Verification failed — token mismatch.");
  res.sendStatus(403);
});

// Webhook events (POST)
router.post("/", async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately
  const body = req.body;
  if (body.object !== "instagram") return;

  for (const entry of body.entry || []) {
    // ── DM messages ──────────────────────────────────────
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      const text     = event.message?.text;
      if (!senderId || !text) continue;

      try {
        const igRows = await db.queryAsync(
          "SELECT * FROM instagram_accounts WHERE ig_user_id = ? LIMIT 1",
          [entry.id]
        );
        if (!igRows.length) continue;
        const ig = igRows[0];

        const ruleRows = await db.queryAsync(
          "SELECT * FROM dm_rules WHERE ig_account_id = ? AND is_active = 1 AND ? LIKE CONCAT('%', keyword, '%') LIMIT 1",
          [ig.id, text.toLowerCase()]
        );
        if (!ruleRows.length) continue;
        const rule = ruleRows[0];

        if (rule.static_message) {
          await instagramService.sendDM(ig.page_id, ig.access_token, senderId, rule.static_message);
        }
        await instagramService.sendDM(ig.page_id, ig.access_token, senderId, rule.response);
        await db.queryAsync(
          "UPDATE dm_rules SET triggered_count = triggered_count + 1 WHERE id = ?",
          [rule.id]
        );
        console.log(`[Webhook] DM auto-reply sent for keyword: "${rule.keyword}"`);
      } catch (e) {
        console.error("[Webhook] DM error:", e.message);
      }
    }

    // ── Comment events ────────────────────────────────────
    for (const change of entry.changes || []) {
      if (change.field !== "comments") continue;
      const { text, from, media } = change.value || {};
      if (!text || !from?.id) continue;

      try {
        const igRows = await db.queryAsync(
          "SELECT * FROM instagram_accounts WHERE ig_user_id = ? LIMIT 1",
          [entry.id]
        );
        if (!igRows.length) continue;
        const ig = igRows[0];

        const ruleRows = await db.queryAsync(
          `SELECT * FROM comment_rules
           WHERE ig_account_id = ? AND is_active = 1
             AND ? LIKE CONCAT('%', keyword, '%')
             AND (post_id IS NULL OR post_id = ?)
           LIMIT 1`,
          [ig.id, text.toLowerCase(), media?.id || ""]
        );
        if (!ruleRows.length) continue;
        const rule = ruleRows[0];

        await instagramService.sendDM(ig.page_id, ig.access_token, from.id, rule.dm_message);
        await db.queryAsync(
          "UPDATE comment_rules SET triggered_count = triggered_count + 1 WHERE id = ?",
          [rule.id]
        );
        console.log(`[Webhook] Comment auto-DM sent for keyword: "${rule.keyword}"`);
      } catch (e) {
        console.error("[Webhook] Comment error:", e.message);
      }
    }
  }
});

module.exports = router;
