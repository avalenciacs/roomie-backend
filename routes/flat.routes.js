
const router = require("express").Router();
const mongoose = require("mongoose");

const Flat = require("../models/Flat.model");
const User = require("../models/User.model");
const Expense = require("../models/Expense.model");
const Task = require("../models/Task.model"); 
const { isAuthenticated } = require("../middleware/jwt.middleware");

// ─────────────────────────
// Helpers
// ─────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const ensureMember = async (flatId, userId) => {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true, flat };
};

// ─────────────────────────
// CREATE flat
// POST /api/flats
// ─────────────────────────
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.payload._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const newFlat = await Flat.create({
      name: name.trim(),
      description: (description || "").trim(),
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
// GET /api/flats
// ─────────────────────────
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const flats = await Flat.find({ members: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(flats);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────
// READ flat detail (solo miembros)
// GET /api/flats/:flatId
// ─────────────────────────
router.get("/:flatId", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const flat = await Flat.findById(flatId).populate("members", "name email");

    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    if (!flat.members.map((m) => String(m._id)).includes(String(userId))) {
      return res.status(403).json({ message: "Not allowed" });
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
// GET /api/flats/:flatId/members
router.get("/:flatId/members", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (!flat.members.map(String).includes(String(userId))) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const populatedFlat = await Flat.findById(flatId).populate("members", "name email");
    res.json(populatedFlat.members);
  } catch (error) {
    next(error);
  }
});

// ADD member (solo owner)
// POST /api/flats/:flatId/members
router.post("/:flatId/members", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { email } = req.body;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    if (flat.members.map(String).includes(String(userToAdd._id))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    flat.members.push(userToAdd._id);
    await flat.save();

    const updatedFlat = await Flat.findById(flatId).populate("members", "name email");
    res.json(updatedFlat);
  } catch (error) {
    next(error);
  }
});

// REMOVE member (solo owner)
// DELETE /api/flats/:flatId/members/:memberId
router.delete("/:flatId/members/:memberId", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId, memberId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId) || !isValidObjectId(memberId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    if (String(memberId) === String(flat.owner)) {
      return res.status(400).json({ message: "Owner cannot be removed" });
    }

    flat.members = flat.members.filter((m) => String(m) !== String(memberId));
    await flat.save();

    const updatedFlat = await Flat.findById(flatId).populate("members", "name email");
    res.json(updatedFlat);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────
// EXPENSES FlatDetails
// ─────────────────────────

// GET /api/flats/:flatId/expenses (solo miembros)
router.get("/:flatId/expenses", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const auth = await ensureMember(flatId, userId);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const expenses = await Expense.find({ flat: flatId })
      .populate("paidBy", "name email")
      .populate("createdBy", "name email")
      .populate("splitBetween", "name email")
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// POST /api/flats/:flatId/expenses (solo miembros)
router.post("/:flatId/expenses", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const auth = await ensureMember(flatId, userId);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const {
      title,
      amount,
      paidBy,
      splitBetween,
      date,
      category = "general", 
      notes = "",
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (!paidBy || !isValidObjectId(paidBy)) {
      return res.status(400).json({ message: "paidBy is required" });
    }

    // splitBetween: si viene vacío -> todos los miembros
    let split = Array.isArray(splitBetween) ? splitBetween : [];
    split = split.filter((id) => isValidObjectId(id));
    if (split.length === 0) split = auth.flat.members.map((m) => String(m));

    // Validar que paidBy y split sean miembros
    const memberSet = new Set(auth.flat.members.map((m) => String(m)));
    if (!memberSet.has(String(paidBy))) {
      return res.status(400).json({ message: "paidBy must be a flat member" });
    }
    if (split.some((id) => !memberSet.has(String(id)))) {
      return res.status(400).json({ message: "splitBetween must contain only flat members" });
    }

    const created = await Expense.create({
      title: title.trim(),
      amount: numericAmount,
      paidBy,
      splitBetween: split,
      date: date ? new Date(date) : new Date(),
      category, 
      notes: notes.trim(),
      flat: flatId,
      createdBy: userId,
    });

    const populated = await Expense.findById(created._id)
      .populate("paidBy", "name email")
      .populate("createdBy", "name email")
      .populate("splitBetween", "name email");

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────
// TASKS FlatDetails
// ─────────────────────────

// GET /api/flats/:flatId/tasks (solo miembros)
router.get("/:flatId/tasks", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const auth = await ensureMember(flatId, userId);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const tasks = await Task.find({ flat: flatId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/flats/:flatId/tasks (solo miembros)
router.post("/:flatId/tasks", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const auth = await ensureMember(flatId, userId);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const { title, description = "", assignedTo = null, status = "pending" } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // validar  miembro
    if (assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({ message: "assignedTo invalid" });
      }
      const memberSet = new Set(auth.flat.members.map((m) => String(m)));
      if (!memberSet.has(String(assignedTo))) {
        return res.status(400).json({ message: "assignedTo must be a flat member" });
      }
    }

    const created = await Task.create({
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      status,
      flat: flatId,
      createdBy: userId,
    });

    const populated = await Task.findById(created._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populated);
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

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const flat = await Flat.findById(flatId).populate("members", "name email");
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (!flat.members.map((m) => String(m._id)).includes(String(userId))) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const expenses = await Expense.find({ flat: flatId });

    const balance = {};
    flat.members.forEach((m) => {
      balance[String(m._id)] = 0;
    });

    for (const exp of expenses) {
      const paidBy = String(exp.paidBy);
      const split = exp.splitBetween || [];
      if (!split.length) continue;

      const share = exp.amount / split.length;

      balance[paidBy] += exp.amount;
      split.forEach((u) => {
        balance[String(u)] -= share;
      });
    }

    const totals = flat.members.map((m) => ({
      userId: String(m._id),
      email: m.email,
      net: Number((balance[String(m._id)] || 0).toFixed(2)),
    }));

    // settlements
    const creditors = totals.filter((t) => t.net > 0).map((t) => ({ ...t }));
    const debtors = totals
      .filter((t) => t.net < 0)
      .map((t) => ({ ...t, net: Math.abs(t.net) }));

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
