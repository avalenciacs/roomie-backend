const router = require("express").Router();

const Flat = require("../models/Flat.model");
const Expense = require("../models/Expense.model");
const Task = require("../models/Task.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

async function ensureMember(flatId, userId) {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true };
}

// Helper: month range (current month)
function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

router.get(
  "/flats/:flatId/dashboard",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { flatId } = req.params;
      const userId = req.payload._id;

      const check = await ensureMember(flatId, userId);
      if (!check.ok) return res.status(check.status).json({ message: check.message });

      // Flat members
      const flat = await Flat.findById(flatId).populate("members", "name email");

      // Month range
      const { start, end } = getMonthRange(new Date());

      // Expenses for month (charts + summary)
      const monthExpenses = await Expense.find({
        flat: flatId,
        date: { $gte: start, $lt: end },
      })
        .sort({ date: -1 })
        .populate("paidBy", "name email")
        .populate("splitBetween", "name email")
        .populate("createdBy", "name email");

      // Recent expenses (latest 5 overall)
      const recentExpenses = await Expense.find({ flat: flatId })
        .sort({ date: -1 })
        .limit(5)
        .populate("paidBy", "name email")
        .populate("createdBy", "name email");

      // Pending tasks count
      const pendingTasksCount = await Task.countDocuments({
        flat: flatId,
        status: { $in: ["pending", "doing"] },
      });

      // Summary: month total
      const monthTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

      // Chart: byCategory
      const catMap = new Map();
      for (const e of monthExpenses) {
        const cat = e.category || "general";
        catMap.set(cat, (catMap.get(cat) || 0) + Number(e.amount || 0));
      }
      const byCategory = Array.from(catMap.entries())
        .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }))
        .sort((a, b) => b.total - a.total);

      // Chart: balance by user (net) based on ALL expenses (not only month)
      const allExpenses = await Expense.find({ flat: flatId })
        .populate("paidBy", "name email")
        .populate("splitBetween", "name email");

      const balanceMap = new Map();
      for (const m of flat.members) balanceMap.set(String(m._id), 0);

      for (const exp of allExpenses) {
        const participants = exp.splitBetween?.length ? exp.splitBetween : [];
        if (!participants.length) continue;

        const share = Number(exp.amount) / participants.length;
        const payerId = String(exp.paidBy?._id);

        balanceMap.set(payerId, (balanceMap.get(payerId) || 0) + Number(exp.amount));

        for (const p of participants) {
          const pid = String(p._id);
          balanceMap.set(pid, (balanceMap.get(pid) || 0) - share);
        }
      }

      const byUser = flat.members
        .map((m) => ({
          userId: String(m._id),
          name: m.name || m.email,
          email: m.email,
          net: Number((balanceMap.get(String(m._id)) || 0).toFixed(2)),
        }))
        .sort((a, b) => b.net - a.net);

      res.json({
        flat: { _id: flat._id, name: flat.name, description: flat.description },
        summary: {
          membersCount: flat.members.length,
          monthTotal: Number(monthTotal.toFixed(2)),
          pendingTasksCount,
          monthLabel: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
        },
        recentExpenses,
        charts: {
          byCategory,
          byUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
