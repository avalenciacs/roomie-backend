const router = require("express").Router();

const Flat = require("../models/Flat.model");
const Expense = require("../models/Expense.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

async function ensureMember(flatId, userId) {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true };
}


router.get("/flats/:flatId/balance", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    // Load members with name/email
    const flat = await Flat.findById(flatId).populate("members", "name email");
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    // Load expenses for this flat
    const expenses = await Expense.find({ flat: flatId })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email");

    // balanceMap[userId] = net
    const balanceMap = new Map();
    for (const m of flat.members) balanceMap.set(String(m._id), 0);

    for (const exp of expenses) {
   
      const participants =
        Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0
          ? exp.splitBetween
          : flat.members;

      const payerId = String(exp.paidBy?._id);
      if (!payerId) continue;

      const amount = Number(exp.amount || 0);
      if (!amount || amount < 0) continue;

      const share = amount / participants.length;

      // payer gets credit for full amount
      balanceMap.set(payerId, (balanceMap.get(payerId) || 0) + amount);

      // participants owe their share
      for (const p of participants) {
        const pid = String(p._id);
        balanceMap.set(pid, (balanceMap.get(pid) || 0) - share);
      }
    }

    const totals = flat.members
      .map((m) => ({
        user: { _id: m._id, name: m.name, email: m.email },
        net: Number((balanceMap.get(String(m._id)) || 0).toFixed(2)),
      }))
      .sort((a, b) => b.net - a.net);

    // settlements global (greedy)
    const creditors = totals
      .filter((x) => x.net > 0)
      .map((x) => ({ user: x.user, remaining: x.net }));
    const debtors = totals
      .filter((x) => x.net < 0)
      .map((x) => ({ user: x.user, remaining: Math.abs(x.net) }));

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];

      const amount = Math.min(d.remaining, c.remaining);
      if (amount > 0.009) {
        settlements.push({
          from: d.user,
          to: c.user,
          amount: Number(amount.toFixed(2)),
        });
      }

      d.remaining -= amount;
      c.remaining -= amount;

      if (d.remaining <= 0.009) i++;
      if (c.remaining <= 0.009) j++;
    }

    res.json({ totals, settlements });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
