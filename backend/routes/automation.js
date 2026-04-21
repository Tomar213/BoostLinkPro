const express             = require("express");
const router              = express.Router();
const db                  = require("../models/db");
const { isAuthenticated } = require("../middleware/auth");
const instagramService    = require("../services/instagramService");

const getIG = async (userId) => {
  const rows = await db.queryAsync(
    "SELECT * FROM instagram_accounts WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
};

// ── DM Rules ──────────────────────────────────────────────────────────────

router.get("/dm-rules", isAuthenticated, async (req, res) => {
  try {
    const rules = await db.queryAsync(
      "SELECT * FROM dm_rules WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, data: rules });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/dm-rules", isAuthenticated, async (req, res) => {
  const { keyword, response, staticMessage } = req.body;
  if (!keyword?.trim() || !response?.trim())
    return res.status(400).json({ error: "keyword and response are required." });
  try {
    const ig = await getIG(req.user.id);
    if (!ig) return res.status(400).json({ error: "No Instagram account connected.", needsConnect: true });

    const result = await db.queryAsync(
      "INSERT INTO dm_rules (user_id, ig_account_id, keyword, response, static_message) VALUES (?,?,?,?,?)",
      [req.user.id, ig.id, keyword.trim().toLowerCase(), response.trim(), staticMessage?.trim() || null]
    );
    const rows = await db.queryAsync("SELECT * FROM dm_rules WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/dm-rules/:id", isAuthenticated, async (req, res) => {
  try {
    const rows = await db.queryAsync(
      "SELECT * FROM dm_rules WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Rule not found." });
    const rule = rows[0];
    const { keyword, response, staticMessage, isActive } = req.body;
    await db.queryAsync(
      "UPDATE dm_rules SET keyword=?, response=?, static_message=?, is_active=? WHERE id=?",
      [
        keyword       ?? rule.keyword,
        response      ?? rule.response,
        staticMessage ?? rule.static_message,
        isActive !== undefined ? (isActive ? 1 : 0) : rule.is_active,
        rule.id,
      ]
    );
    const updated = await db.queryAsync("SELECT * FROM dm_rules WHERE id = ?", [rule.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/dm-rules/:id", isAuthenticated, async (req, res) => {
  try {
    const result = await db.queryAsync(
      "DELETE FROM dm_rules WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Rule not found." });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Comment Rules ─────────────────────────────────────────────────────────

router.get("/comment-rules", isAuthenticated, async (req, res) => {
  try {
    const rules = await db.queryAsync(
      "SELECT * FROM comment_rules WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, data: rules });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/comment-rules", isAuthenticated, async (req, res) => {
  const { keyword, dmMessage, postId } = req.body;
  if (!keyword?.trim() || !dmMessage?.trim())
    return res.status(400).json({ error: "keyword and dmMessage are required." });
  try {
    const ig = await getIG(req.user.id);
    if (!ig) return res.status(400).json({ error: "No Instagram account connected.", needsConnect: true });

    const result = await db.queryAsync(
      "INSERT INTO comment_rules (user_id, ig_account_id, keyword, dm_message, post_id) VALUES (?,?,?,?,?)",
      [req.user.id, ig.id, keyword.trim().toLowerCase(), dmMessage.trim(), postId?.trim() || null]
    );
    const rows = await db.queryAsync("SELECT * FROM comment_rules WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/comment-rules/:id", isAuthenticated, async (req, res) => {
  try {
    const rows = await db.queryAsync(
      "SELECT * FROM comment_rules WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Rule not found." });
    const rule = rows[0];
    const { keyword, dmMessage, postId, isActive } = req.body;
    await db.queryAsync(
      "UPDATE comment_rules SET keyword=?, dm_message=?, post_id=?, is_active=? WHERE id=?",
      [
        keyword    ?? rule.keyword,
        dmMessage  ?? rule.dm_message,
        postId     ?? rule.post_id,
        isActive !== undefined ? (isActive ? 1 : 0) : rule.is_active,
        rule.id,
      ]
    );
    const updated = await db.queryAsync("SELECT * FROM comment_rules WHERE id = ?", [rule.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/comment-rules/:id", isAuthenticated, async (req, res) => {
  try {
    const result = await db.queryAsync(
      "DELETE FROM comment_rules WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Rule not found." });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Test DM ───────────────────────────────────────────────────────────────
router.post("/test-dm", isAuthenticated, async (req, res) => {
  const { recipientId, message } = req.body;
  try {
    const ig = await getIG(req.user.id);
    if (!ig) return res.status(400).json({ error: "No IG account connected." });
    await instagramService.sendDM(ig.page_id, ig.access_token, recipientId, message);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
