const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User.model");
const Flat = require("../models/Flat.model");
const Invitation = require("../models/Invitation.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

const saltRounds = 10;

async function acceptPendingInvitesForEmail({ userId, email }) {
  const cleanEmail = (email || "").toLowerCase().trim();
  if (!cleanEmail) return;

  const pending = await Invitation.find({
    email: cleanEmail,
    status: "pending",
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!pending.length) return;

  const flatIds = [...new Set(pending.map((i) => String(i.flat)))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );

  await Flat.updateMany(
    { _id: { $in: flatIds } },
    { $addToSet: { members: userId } }
  );

  await Invitation.updateMany(
    { _id: { $in: pending.map((i) => i._id) } },
    {
      $set: {
        status: "accepted",
        acceptedBy: userId,
        acceptedAt: new Date(),
      },
    }
  );
}

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Provide email, password and name" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Provide a valid email address." });
    }

    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const foundUser = await User.findOne({ email: cleanEmail });
    if (foundUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email: cleanEmail,
      password: hashedPassword,
      name: String(name).trim(),
    });

    await acceptPendingInvitesForEmail({
      userId: createdUser._id,
      email: createdUser.email,
    });

    const user = {
      _id: createdUser._id,
      email: createdUser.email,
      name: createdUser.name,
    };

    return res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Robust validation (prevents email.trim() crashing)
    if (!email || !password) {
      return res.status(400).json({ message: "Provide email and password." });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const foundUser = await User.findOne({ email: cleanEmail });
    if (!foundUser) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!foundUser.password) {
      return res.status(500).json({ message: "User has no password set." });
    }

    const passwordCorrect = await bcrypt.compare(
      String(password),
      foundUser.password
    );

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Unable to authenticate the user" });
    }

    if (!process.env.TOKEN_SECRET) {
      // This is the #1 cause of 500 in Vercel for login
      return res
        .status(500)
        .json({ message: "Missing TOKEN_SECRET on server." });
    }

    const payload = {
      _id: foundUser._id,
      email: foundUser.email,
      name: foundUser.name,
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    return res.status(200).json({ authToken });
  } catch (err) {
    next(err);
  }
});

router.get("/verify", isAuthenticated, (req, res) => {
  return res.status(200).json(req.payload);
});

module.exports = router;