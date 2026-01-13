const router = require("express").Router();
const Flat = require("../models/Flat.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

const User = require("../models/User.model");

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

router.get("/:flatId/members", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId);

    if (!flat) return res.status(404).json({ message: "Flat not found" });

    // solo miembros pueden ver
    if (!flat.members.map(String).includes(String(userId))) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const flatWithMembers = await Flat.findById(flatId).populate("members");
    res.json(flatWithMembers.members);
  } catch (error) {
    next(error);
  }
});

router.post("/:flatId/members", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { email } = req.body;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    // solo owner puede añadir
    if (String(flat.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyMember = flat.members.map(String).includes(String(userToAdd._id));
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    flat.members.push(userToAdd._id);
    await flat.save();

    const updatedFlat = await Flat.findById(flatId).populate("members");
    res.json(updatedFlat);
  } catch (error) {
    next(error);
  }
});


router.delete("/:flatId/members/:memberId", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId, memberId } = req.params;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    // solo owner puede eliminar
    if (String(flat.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    // evitar borrar al owner
    if (String(memberId) === String(flat.owner)) {
      return res.status(400).json({ message: "Owner cannot be removed" });
    }

    flat.members = flat.members.filter((m) => String(m) !== String(memberId));
    await flat.save();

    const updatedFlat = await Flat.findById(flatId).populate("members");
    res.json(updatedFlat);
  } catch (error) {
    next(error);
  }
});







module.exports = router;