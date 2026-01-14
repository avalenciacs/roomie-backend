const router = require("express").Router();

const Flat = require("../models/Flat.model");
const User = require("../models/User.model");
const Expense = require("../models/Expense.model");

const { isAuthenticated } = require("../middleware/jwt.middleware");


// ─────────────────────────
// CREATE flat
// ─────────────────────────
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


// ─────────────────────────
// READ my flats
// ─────────────────────────
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


// ─────────────────────────
// READ flat detail
// ─────────────────────────
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


// ─────────────────────────
// MEMBERS
// ─────────────────────────

// LIST members (solo miembros)
router.get("/:flatId/members", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (!flat.members.map(String).includes(String(userId))) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const populatedFlat = await Flat.findById(flatId).populate("members");
    res.json(populatedFlat.members);
  } catch (error) {
    next(error);
  }
});

// ADD member (solo owner)
router.post("/:flatId/members", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { email } = req.body;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    if (flat.members.map(String).includes(String(userToAdd._id))) {
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

// REMOVE member (solo owner)
router.delete("/:flatId/members/:memberId", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId, memberId } = req.params;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    if (String(memberId) === String(flat.owner)) {
      return res.status(400).json({ message: "Owner cannot be removed" });
    }

    flat.members = flat.members.filter(
      (m) => String(m) !== String(memberId)
    );

    await flat.save();

    const updatedFlat = await Flat.findById(flatId).populate("members");
    res.json(updatedFlat);
  } catch (error) {
    next(error);
  }
});


// ─────────────────────────
// BALANCE
// ─────────────────────────
router.get("/:flatId/balance", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const flat = await Flat.findById(flatId).populate("members", "email");
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (!flat.members.map(m => String(m._id)).includes(String(userId))) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const expenses = await Expense.find({ flat: flatId });

    const balance = {};
    flat.members.forEach(m => {
      balance[String(m._id)] = 0;
    });

    for (const exp of expenses) {
      const paidBy = String(exp.paidBy);
      const split = exp.splitBetween || [];
      if (!split.length) continue;

      const share = exp.amount / split.length;

      balance[paidBy] += exp.amount;

      split.forEach(u => {
        balance[String(u)] -= share;
      });
    }

    const totals = flat.members.map(m => ({
      userId: String(m._id),
      email: m.email,
      net: Number(balance[String(m._id)].toFixed(2)),
    }));

    const creditors = totals.filter(t => t.net > 0).map(t => ({ ...t }));
    const debtors = totals.filter(t => t.net < 0).map(t => ({ ...t, net: Math.abs(t.net) }));

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(debtor.net, creditor.net);

      settlements.push({
        from: debtor.email,
        to: creditor.email,
        amount: Number(amount.toFixed(2)),
      });

      debtor.net -= amount;
      creditor.net -= amount;

      if (debtor.net <= 0.001) i++;
      if (creditor.net <= 0.001) j++;
    }

    res.json({ totals, settlements });
  } catch (error) {
    next(error);
  }
});



module.exports = router;