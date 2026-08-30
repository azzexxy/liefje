require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session");

const authRoutes = require("./src/routes/auth");
const memoriesRoutes = require("./src/routes/memories");
const { GitHubError } = require("./src/github");

if (!process.env.SESSION_SECRET) {
  console.warn("WARNING: SESSION_SECRET is not set — using an insecure default. Set it before deploying.");
}
if (!process.env.USERS) {
  console.warn("WARNING: USERS is not set — nobody will be able to log in.");
}

const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "liefje_session",
    secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", authRoutes);
app.use("/api/memories", memoriesRoutes);

app.get("/healthz", (req, res) => res.json({ ok: true, dryRun: process.env.DRY_RUN === "true" }));

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
  if (err && err.name === "Error" && /cloudinary/i.test(err.message || "")) {
    return res.status(502).json({ error: "De foto kon niet geüpload worden. Probeer het opnieuw." });
  }

  res.status(500).json({ error: "Er ging iets mis op de server." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`liefje memories server listening on :${PORT}${process.env.DRY_RUN === "true" ? " (DRY_RUN)" : ""}`);
});
