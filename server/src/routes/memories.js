const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../auth");
const { uploadPhoto } = require("../cloudinary");
const { getFile, putFile, GitHubError } = require("../github");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error("Alleen afbeeldingen zijn toegestaan."));
    }
    cb(null, true);
  },
});

const DATE_RE = /^\d{1,2}\/\d{1,2}$/;
const memoriesPath = () => process.env.GITHUB_MEMORIES_PATH || "assets/data/memories.json";

function slugify(title) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "memory"
  );
}

async function commitMemory(memory, attempt = 1) {
  const filePath = memoriesPath();
  const existing = await getFile(filePath);
  const list = existing ? JSON.parse(existing.content) : [];
  list.push(memory);
  const contentBuffer = Buffer.from(JSON.stringify(list, null, 2) + "\n", "utf-8");
  try {
    await putFile({
      path: filePath,
      contentBuffer,
      sha: existing ? existing.sha : undefined,
      message: `Add memory: ${memory.title}`,
    });
  } catch (err) {
    // Someone else committed in between fetching the sha and writing — retry once with a fresh sha.
    if (err instanceof GitHubError && err.status === 409 && attempt < 3) {
      return commitMemory(memory, attempt + 1);
    }
    throw err;
  }
}

router.post("/", requireAuth, upload.array("photos", 6), async (req, res, next) => {
  try {
    const { title, place, date, side } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Titel is verplicht." });
    if (!place || !place.trim()) return res.status(400).json({ error: "Plaats is verplicht." });
    if (!date || !DATE_RE.test(date.trim())) {
      return res.status(400).json({ error: "Datum moet het formaat dd/mm hebben, bv. 05/08." });
    }
    if (side && side !== "left" && side !== "right") {
      return res.status(400).json({ error: "Ongeldige kant gekozen." });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Voeg minstens 1 foto toe." });
    }

    const dryRun = process.env.DRY_RUN === "true";
    const id = `${slugify(title)}-${Date.now()}`;

    let photos;
    if (dryRun) {
      photos = req.files.map((_, i) => `https://dry-run.example/${id}-${i}.jpg`);
    } else {
      photos = await Promise.all(req.files.map((file, i) => uploadPhoto(file.buffer, `${id}-${i}`)));
    }

    const memory = {
      id,
      title: title.trim(),
      place: place.trim(),
      date: date.trim(),
      ...(side ? { side } : {}),
      photos,
      addedBy: req.session.user,
      createdAt: new Date().toISOString(),
    };

    if (dryRun) {
      return res.json({ ok: true, dryRun: true, memory });
    }

    await commitMemory(memory);
    res.json({ ok: true, memory });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
