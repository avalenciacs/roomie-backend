// backend/routes/uploads.routes.js  ✅ COMPLETO (sin cambios funcionales, solo claro)
const router = require("express").Router();
const uploader = require("../config/uploader");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// POST /api/uploads/image  (form-data key: "image")
router.post("/image", isAuthenticated, uploader.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing image file" });
    }

    // multer-storage-cloudinary deja la url en req.file.path
    return res.status(201).json({
      imageUrl: req.file.path,
    });
  } catch (err) {
    return res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
