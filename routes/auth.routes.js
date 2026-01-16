const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

const saltRounds = 10;

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (email === "" || password === "" || name === "") {
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

    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email,
      password: hashedPassword,
      name,
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

    if (email === "" || password === "") {
      return res.status(400).json({ message: "Provide email and password." });
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ message: "User not found." });
    }

    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Unable to authenticate the user" });
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
