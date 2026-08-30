const express = require("express");
const { verifyCredentials } = require("../auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const ok = await verifyCredentials(username, password);
    if (!ok) return res.status(401).json({ error: "Verkeerde gebruikersnaam of wachtwoord." });
    req.session.user = username;
    res.json({ ok: true, username });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Er ging iets mis bij het inloggen." });
  }
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  res.json({ user: (req.session && req.session.user) || null });
});

module.exports = router;
