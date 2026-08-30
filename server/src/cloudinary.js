const cloudinary = require("cloudinary").v2;
// cloudinary.config() automatically picks up CLOUDINARY_URL from the environment.

function uploadPhoto(buffer, publicIdHint) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "liefje-memories", public_id: publicIdHint, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadPhoto };
