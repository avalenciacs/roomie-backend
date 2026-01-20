const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "roomie",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      // nombre opcional:
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`,
    };
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = uploader;
