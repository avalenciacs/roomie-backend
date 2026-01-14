const router = require("express").Router();
const Expense = require("../models/Expense.model");
const Flat = require("../models/Flat.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// helper: comprobar si user es miembro del flat
async function ensureMember(flatId, userId) {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true, flat };
}

// CREATE expense (en un flat)
router.post("/flats/:flatId/expenses", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const { title, amount, paidBy, splitBetween, category, date } = req.body;

    const expense = await Expense.create({
      flat: flatId,
      title,
      amount,
      paidBy,
      splitBetween,
      category,
      date,
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// READ expenses by flat
router.get("/flats/:flatId/expenses", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const expenses = await Expense.find({ flat: flatId })
      .populate("paidBy", "name email")
      .populate("splitBetween", "email")
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// READ expense detail
router.get("/expenses/:expenseId", isAuthenticated, async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.payload._id;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "email")
      .populate("splitBetween", "email");

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const check = await ensureMember(expense.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// UPDATE expense
router.put("/expenses/:expenseId", isAuthenticated, async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.payload._id;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const check = await ensureMember(expense.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const updated = await Expense.findByIdAndUpdate(expenseId, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE expense
router.delete("/expenses/:expenseId", isAuthenticated, async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.payload._id;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const check = await ensureMember(expense.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    await Expense.findByIdAndDelete(expenseId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
