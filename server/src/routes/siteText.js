const express = require("express");
const { requireAuth } = require("../auth");
const { getFile, putFile, GitHubError } = require("../github");

const router = express.Router();

const siteTextPath = () => process.env.GITHUB_SITE_TEXT_PATH || "assets/data/site-text.json";
const KEY_RE = /^[a-z0-9-]{1,60}$/;

// Same read-modify-write-with-retry shape as memories.js's commitMemoriesList,
// just against a plain {key: text} object instead of a list — kept separate
// since the two data shapes don't share enough to be worth a forced-common
// abstraction over.
async function commitSiteText(mutate, message, attempt = 1) {
  const filePath = siteTextPath();
  const existing = await getFile(filePath);
  const data = existing ? JSON.parse(existing.content) : {};
  mutate(data);

  const contentBuffer = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf-8");
  try {
    await putFile({
      path: filePath,
      contentBuffer,
      sha: existing ? existing.sha : undefined,
      message,
    });
  } catch (err) {
    if (err instanceof GitHubError && err.status === 409 && attempt < 3) {
      return commitSiteText(mutate, message, attempt + 1);
    }
    throw err;
  }
  return data;
}

router.patch("/:key", requireAuth, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { text } = req.body || {};
    if (!KEY_RE.test(key)) return res.status(400).json({ error: "Ongeldige sleutel." });
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Tekst mag niet leeg zijn." });
    }

    const dryRun = process.env.DRY_RUN === "true";
    if (dryRun) return res.json({ ok: true, dryRun: true, key, text: text.trim() });

    const data = await commitSiteText((d) => {
      d[key] = text.trim();
    }, `Edit site text: ${key}`);
    res.json({ ok: true, key, text: data[key] });
  } catch (err) {
    next(err);
  }
});

// Removes a piece of text from the page entirely (same idea as deleting a
// memory) — stored as an explicit `null`, distinct from a key that was
// simply never edited, so the frontend knows to hide the element instead
// of falling back to the default text baked into the HTML.
router.delete("/:key", requireAuth, async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!KEY_RE.test(key)) return res.status(400).json({ error: "Ongeldige sleutel." });

    const dryRun = process.env.DRY_RUN === "true";
    if (dryRun) return res.json({ ok: true, dryRun: true, key });

    await commitSiteText((d) => {
      d[key] = null;
    }, `Delete site text: ${key}`);
    res.json({ ok: true, key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
