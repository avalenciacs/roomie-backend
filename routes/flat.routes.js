const router = require("express").Router();
const Flat = require("../models/Flat.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// CREATE flat
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.payload._id;

    const newFlat = await Flat.create({
      name,
      description,
      owner: userId,
      members: [userId],
    });

    res.status(201).json(newFlat);
  } catch (error) {
    next(error);
  }
});

// READ my flats
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const flats = await Flat.find({
      members: userId,
    });

    res.json(flats);
  } catch (error) {
    next(error);
  }
});

// READ flat detail
router.get("/:flatId", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;

    const flat = await Flat.findById(flatId).populate("members");

    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    res.json(flat);
  } catch (error) {
    next(error);
  }
});

module.exports = router;