const bcrypt = require("bcryptjs");

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

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: "Je bent niet ingelogd." });
}

module.exports = { verifyCredentials, requireAuth, USERS };
