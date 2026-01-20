const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense.model");
const Flat = require("../models/Flat.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

async function ensureMember(flatId, userId) {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true, flat };
}

function validateExpensePayload(body) {
  const { title, amount, paidBy, splitBetween } = body;

  if (!title || typeof title !== "string") return "Title is required";
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return "Amount is required";
  }
  if (Number(amount) < 0) return "Amount must be >= 0";
  if (!paidBy) return "paidBy is required";
  if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
    return "splitBetween must be a non-empty array";
  }
  return null;
}

// CREATE expense
// CREATE expense
router.post("/flats/:flatId/expenses", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    // si tienes ensureMember aquí, úsalo:
    // const check = await ensureMember(flatId, userId);
    // if (!check.ok) return res.status(check.status).json({ message: check.message });

    const {
      title,
      amount,
      paidBy,
      splitBetween = [],
      date,
      category = "general",
      notes = "",
      imageUrl = "", // ✅ opcional
    } = req.body;

    const expense = await Expense.create({
      flat: flatId,
      createdBy: userId,
      title: String(title || "").trim(),
      amount: Number(amount),
      paidBy,
      splitBetween: Array.isArray(splitBetween) ? splitBetween : [],
      date: date ? new Date(date) : new Date(),
      category,
      notes: String(notes || "").trim(),
      imageUrl: String(imageUrl || ""),
    });

    const populated = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});


// READ expenses by flat
router.get(
  "/flats/:flatId/expenses",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { flatId } = req.params;
      const userId = req.payload._id;

      const check = await ensureMember(flatId, userId);
      if (!check.ok)
        return res.status(check.status).json({ message: check.message });

      const expenses = await Expense.find({ flat: flatId })
        .populate("paidBy", "name email")
        .populate("splitBetween", "name email")
        .populate("createdBy", "name email")
        .sort({ date: -1, createdAt: -1 });

      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }
);

// UPDATE expense (solo creador)
router.put("/expenses/:expenseId", isAuthenticated, async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.payload._id;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const check = await ensureMember(expense.flat, userId);
    if (!check.ok)
      return res.status(check.status).json({ message: check.message });

    if (String(expense.createdBy) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Only the creator can edit this expense" });
    }

    const allowed = [
      "title",
      "amount",
      "category",
      "paidBy",
      "splitBetween",
      "notes",
      "date",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.amount !== undefined) {
      if (Number.isNaN(Number(update.amount)) || Number(update.amount) < 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a number >= 0" });
      }
      update.amount = Number(update.amount);
    }
    if (
      update.splitBetween !== undefined &&
      (!Array.isArray(update.splitBetween) || update.splitBetween.length === 0)
    ) {
      return res
        .status(400)
        .json({ message: "splitBetween must be a non-empty array" });
    }

    const updated = await Expense.findByIdAndUpdate(expenseId, update, {
      new: true,
    })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .populate("createdBy", "name email");

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE expense (solo creador)
router.delete(
  "/expenses/:expenseId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { expenseId } = req.params;
      const userId = req.payload._id;

      const expense = await Expense.findById(expenseId);
      if (!expense)
        return res.status(404).json({ message: "Expense not found" });

      const check = await ensureMember(expense.flat, userId);
      if (!check.ok)
        return res.status(check.status).json({ message: check.message });

      if (String(expense.createdBy) !== String(userId)) {
        return res
          .status(403)
          .json({ message: "Only the creator can delete this expense" });
      }

      await Expense.findByIdAndDelete(expenseId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
