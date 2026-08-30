const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAuth } = require("../auth");
const { uploadPhoto, uploadVideo } = require("../cloudinary");
const { trimVideoBuffer, MAX_VIDEO_SECONDS } = require("../video");
const { getFile, putFile, GitHubError } = require("../github");

const router = express.Router();

// Raw phone video before trimming can be large even for a few seconds
// (4K, high frame rate) — the limit here is on the upload, not the result.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//.test(file.mimetype) && !/^video\//.test(file.mimetype)) {
      return cb(new Error("Alleen foto's of video's zijn toegestaan."));
    }
    cb(null, true);
  },
});

// Videos always get cut down to MAX_VIDEO_SECONDS before upload; images pass
// straight through. Same helper used by both create and edit.
async function uploadFile(file, publicIdHint) {
  if (file.mimetype.startsWith("video/")) {
    const trimmed = await trimVideoBuffer(file.buffer, path.extname(file.originalname));
    return uploadVideo(trimmed, publicIdHint);
  }
  return uploadPhoto(file.buffer, publicIdHint);
}

function dryRunUrl(id, i, file) {
  return `https://dry-run.example/${id}-${i}.${file.mimetype.startsWith("video/") ? "mp4" : "jpg"}`;
}

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

// Fetches the current list, lets `mutate` change it in place, and commits
// the result — used for create/edit/delete alike so all three share the
// same read-modify-write-with-retry behavior. `mutate` returns whatever's
// useful to the caller (the new/changed memory, or null if e.g. the id
// wasn't found), which is passed straight through.
async function commitMemoriesList(mutate, commitMessage, attempt = 1) {
  const filePath = memoriesPath();
  const existing = await getFile(filePath);
  const list = existing ? JSON.parse(existing.content) : [];
  const result = mutate(list);
  if (result === null) return null;

  const contentBuffer = Buffer.from(JSON.stringify(list, null, 2) + "\n", "utf-8");
  try {
    await putFile({
      path: filePath,
      contentBuffer,
      sha: existing ? existing.sha : undefined,
      message: commitMessage,
    });
  } catch (err) {
    // Someone else committed in between fetching the sha and writing — retry once with a fresh sha.
    if (err instanceof GitHubError && err.status === 409 && attempt < 3) {
      return commitMemoriesList(mutate, commitMessage, attempt + 1);
    }
    throw err;
  }
  return result;
}

router.post("/", requireAuth, upload.array("photos", 6), async (req, res, next) => {
  try {
    const { title, place, date } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Titel is verplicht." });
    if (!place || !place.trim()) return res.status(400).json({ error: "Plaats is verplicht." });
    if (!date || !DATE_RE.test(date.trim())) {
      return res.status(400).json({ error: "Datum moet het formaat dd/mm hebben, bv. 05/08." });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Voeg minstens 1 foto of video toe." });
    }

    const dryRun = process.env.DRY_RUN === "true";
    const id = `${slugify(title)}-${Date.now()}`;

    let photos;
    if (dryRun) {
      photos = req.files.map((file, i) => dryRunUrl(id, i, file));
    } else {
      photos = await Promise.all(req.files.map((file, i) => uploadFile(file, `${id}-${i}`)));
    }

    // dd/mm, no year — js/script.js sorts every memory by this and recomputes
    // left/right alternation automatically, so it lands in the right spot.
    const memory = {
      id,
      title: title.trim(),
      place: place.trim(),
      date: date.trim(),
      photos,
      addedBy: req.authUser,
      createdAt: new Date().toISOString(),
    };

    if (dryRun) {
      return res.json({ ok: true, dryRun: true, memory });
    }

    await commitMemoriesList((list) => {
      list.push(memory);
      return memory;
    }, `Add memory: ${memory.title}`);
    res.json({ ok: true, memory });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, upload.array("photos", 6), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, place, date, photosToRemove } = req.body;
    if (date !== undefined && date.trim() && !DATE_RE.test(date.trim())) {
      return res.status(400).json({ error: "Datum moet het formaat dd/mm hebben, bv. 05/08." });
    }

    let removeSet = [];
    if (photosToRemove) {
      try {
        const parsed = JSON.parse(photosToRemove);
        if (Array.isArray(parsed)) removeSet = parsed;
      } catch {
        // malformed — just treat as "nothing to remove" rather than erroring
      }
    }

    const dryRun = process.env.DRY_RUN === "true";
    let newPhotos = [];
    if (req.files && req.files.length > 0) {
      if (dryRun) {
        newPhotos = req.files.map((file, i) => dryRunUrl(`${id}-edit`, i, file));
      } else {
        newPhotos = await Promise.all(
          req.files.map((file, i) => uploadFile(file, `${id}-edit-${Date.now()}-${i}`))
        );
      }
    }

    if (dryRun) {
      return res.json({ ok: true, dryRun: true, id, title, place, date, removeSet, newPhotos });
    }

    const updated = await commitMemoriesList((list) => {
      const idx = list.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      const memory = list[idx];

      if (title !== undefined && title.trim()) memory.title = title.trim();
      if (place !== undefined && place.trim()) memory.place = place.trim();
      if (date !== undefined && date.trim()) memory.date = date.trim();

      if (removeSet.length > 0 || newPhotos.length > 0) {
        const existingPhotos = Array.isArray(memory.photos) ? memory.photos : [];
        const existingAlts = Array.isArray(memory.photoAlts) ? memory.photoAlts : [];
        const keptPhotos = [];
        const keptAlts = [];
        existingPhotos.forEach((photo, i) => {
          if (!removeSet.includes(photo)) {
            keptPhotos.push(photo);
            keptAlts.push(existingAlts[i] || null);
          }
        });
        memory.photos = [...keptPhotos, ...newPhotos];
        const allAlts = [...keptAlts, ...newPhotos.map(() => null)];
        memory.photoAlts = allAlts.some(Boolean) ? allAlts : undefined;
      }

      list[idx] = memory;
      return memory;
    }, `Edit memory: ${id}`);

    if (!updated) return res.status(404).json({ error: "Herinnering niet gevonden." });
    res.json({ ok: true, memory: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const dryRun = process.env.DRY_RUN === "true";
    if (dryRun) return res.json({ ok: true, dryRun: true, id });

    const removed = await commitMemoriesList((list) => {
      const idx = list.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      return list.splice(idx, 1)[0];
    }, `Delete memory: ${id}`);

    if (!removed) return res.status(404).json({ error: "Herinnering niet gevonden." });
    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
