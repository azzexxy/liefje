const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function tokenSecret() {
  return process.env.SESSION_SECRET || "dev-only-secret-change-me";
}

function parseUsers() {
  const raw = process.env.USERS || "";
  const users = new Map();
  raw
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return;
      const username = pair.slice(0, idx).trim();
      const hash = pair.slice(idx + 1).trim();
      if (username && hash) users.set(username, hash);
    });
  return users;
}

const USERS = parseUsers();

async function verifyCredentials(username, password) {
  if (!username || !password) return false;
  const hash = USERS.get(username);
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// Safari (and Firefox, to a lesser extent) blocks cross-site cookies by
// default even with SameSite=None; Secure — so the session cookie only
// reliably works same-origin (admin.html). Cross-origin callers (the
// inline modal on the public site) instead get a bearer token issued at
// login and send it back as `Authorization: Bearer <token>`, which isn't a
// cookie and isn't subject to any of that cross-site blocking.
function issueToken(username) {
  return jwt.sign({ user: username }, tokenSecret(), { expiresIn: "365d" });
}

function userFromBearerToken(req) {
  const match = /^Bearer\s+(.+)$/.exec(req.headers.authorization || "");
  if (!match) return null;
  try {
    return jwt.verify(match[1], tokenSecret()).user || null;
  } catch {
    return null;
  }
}

function currentUser(req) {
  if (req.session && req.session.user) return req.session.user;
  return userFromBearerToken(req);
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Je bent niet ingelogd." });
  req.authUser = user;
  next();
}

module.exports = { verifyCredentials, requireAuth, issueToken, currentUser, USERS };
