const os = require("os");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const MAX_VIDEO_SECONDS = 3;

class VideoProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = "VideoProcessingError";
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, { timeout: 60_000 }, (err, stdout, stderr) => {
      if (err) return reject(new VideoProcessingError(stderr || err.message));
      resolve();
    });
  });
}

// Trims a video buffer down to at most MAX_VIDEO_SECONDS seconds (shorter
// videos pass through unchanged) and re-encodes to a widely-compatible
// H.264/AAC mp4 — re-encoding (rather than a fast stream copy) is what makes
// the cut land exactly at 3s regardless of where the source's keyframes are.
async function trimVideoBuffer(buffer, originalExt) {
  const tmpId = crypto.randomBytes(8).toString("hex");
  const inPath = path.join(os.tmpdir(), `liefje-in-${tmpId}${originalExt || ".mp4"}`);
  const outPath = path.join(os.tmpdir(), `liefje-out-${tmpId}.mp4`);
  await fs.writeFile(inPath, buffer);
  try {
    await runFfmpeg([
      "-y",
      "-i", inPath,
      "-t", String(MAX_VIDEO_SECONDS),
      "-c:v", "libx264",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outPath,
    ]);
    return await fs.readFile(outPath);
  } finally {
    await fs.rm(inPath, { force: true });
    await fs.rm(outPath, { force: true });
  }
}

module.exports = { trimVideoBuffer, VideoProcessingError, MAX_VIDEO_SECONDS };
