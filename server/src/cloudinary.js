class CloudinaryError extends Error {
  constructor(message) {
    super(message);
    this.name = "CloudinaryError";
  }
}

// Requiring "cloudinary" validates CLOUDINARY_URL immediately and throws if
// it's missing/malformed. Loading it lazily, only when a real (non-dry-run)
// upload happens, means a bad env var fails that one request with a clean
// error instead of crashing the whole server at startup.
function loadCloudinary() {
  try {
    return require("cloudinary").v2;
  } catch (err) {
    throw new CloudinaryError(`Cloudinary-configuratie is ongeldig: ${err.message}`);
  }
}

function uploadPhoto(buffer, publicIdHint) {
  return new Promise((resolve, reject) => {
    let cloudinary;
    try {
      cloudinary = loadCloudinary();
    } catch (err) {
      return reject(err);
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: "liefje-memories", public_id: publicIdHint, resource_type: "image" },
      (err, result) => {
        if (err) return reject(new CloudinaryError(err.message || "Cloudinary upload mislukt"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadPhoto, CloudinaryError };
