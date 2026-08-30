const express = require("express");
const rateLimit = require("express-rate-limit");
const { verifyCredentials, issueToken, currentUser } = require("../auth");

const router = express.Router();

// Short passwords (e.g. a PIN) are only safe if brute-forcing them is slow.
// This caps failed attempts per IP so guessing thousands of combinations
// isn't practical, without punishing normal successful logins.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Te veel inlogpogingen. Probeer het over 15 minuten opnieuw." },
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const ok = await verifyCredentials(username, password);
    if (!ok) return res.status(401).json({ error: "Verkeerde gebruikersnaam of wachtwoord." });
    // Set both: the cookie for same-origin admin.html, the token for
    // cross-origin callers whose browser won't reliably keep the cookie.
    req.session.user = username;
    res.json({ ok: true, username, token: issueToken(username) });
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
  res.json({ user: currentUser(req) });
});

module.exports = router;
