require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const authRoutes = require("./src/routes/auth");
const memoriesRoutes = require("./src/routes/memories");
const { GitHubError } = require("./src/github");
const { CloudinaryError } = require("./src/cloudinary");

if (!process.env.SESSION_SECRET) {
  console.warn("WARNING: SESSION_SECRET is not set — using an insecure default. Set it before deploying.");
}
if (!process.env.USERS) {
  console.warn("WARNING: USERS is not set — nobody will be able to log in.");
}

const isProd = process.env.NODE_ENV === "production";
const app = express();
app.set("trust proxy", 1);

// Lets the public site (a different origin — GitHub Pages) call this API
// with cookies attached, for the inline "add memory" modal. Locked to one
// specific origin (never a wildcard) since credentials are involved.
app.use(
  cors({
    origin: process.env.PUBLIC_SITE_ORIGIN || "https://azzexxy.github.io",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "liefje_session",
    secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
    // Long-lived on purpose: this is a private 2-person tool, so once logged
    // in on a device it should just stay logged in rather than asking again.
    maxAge: 365 * 24 * 60 * 60 * 1000,
    // Cross-site cookies (the public site calling this API from a different
    // origin) require SameSite=None, which browsers only honor over HTTPS —
    // hence tying it to production. Locally over plain http, Lax keeps the
    // same-origin admin.html and curl/test flows working as before.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", authRoutes);
app.use("/api/memories", memoriesRoutes);

app.get("/healthz", (req, res) => res.json({ ok: true, dryRun: process.env.DRY_RUN === "true" }));

// Render's health check hits "/" by default — there's no index.html in
// public/ (only admin.html), so without this "/" 404s and the deploy gets
// marked unhealthy even though the app is running fine.
app.get("/", (req, res) => res.redirect("/admin.html"));

app.use((req, res) => res.status(404).json({ error: "Niet gevonden." }));

// Centralized error handler — every route funnels failures here so the client
// always gets a clean JSON error instead of a raw stack trace or a hang.
app.use((err, req, res, next) => {
  console.error(err);

  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Foto is te groot (max 8MB per foto)." });
  }
  if (err && err.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({ error: "Te veel foto's in 1 keer (max 6)." });
  }
  if (err && /Alleen afbeeldingen/.test(err.message || "")) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof GitHubError) {
    return res.status(502).json({ error: "GitHub weigerde de wijziging op te slaan. Probeer het opnieuw." });
  }
  if (err instanceof CloudinaryError) {
    return res.status(502).json({ error: "De foto kon niet geüpload worden. Probeer het opnieuw." });
  }

  res.status(500).json({ error: "Er ging iets mis op de server." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`liefje memories server listening on :${PORT}${process.env.DRY_RUN === "true" ? " (DRY_RUN)" : ""}`);
});
