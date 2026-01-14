const router = require("express").Router();

const Flat = require("../models/Flat.model");
const Expense = require("../models/Expense.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

async function ensureMember(flatId, userId) {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true, flat };
}

router.get("/flats/:flatId/balance", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    // miembros
    const flat = await Flat.findById(flatId).populate("members", "name email");

    const expenses = await Expense.find({ flat: flatId })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email");

    // balanceMap[userId]
    const balanceMap = new Map();
    for (const m of flat.members) balanceMap.set(String(m._id), 0);

    for (const exp of expenses) {
      const participants = exp.splitBetween?.length ? exp.splitBetween : [];
      if (participants.length === 0) continue;

      const share = Number(exp.amount) / participants.length;
      const payerId = String(exp.paidBy?._id);

      // payer recibe de los participantes
      balanceMap.set(payerId, (balanceMap.get(payerId) || 0) + Number(exp.amount));

      // cada participante debe su parte
      for (const p of participants) {
        const pid = String(p._id);
        balanceMap.set(pid, (balanceMap.get(pid) || 0) - share);
      }
    }

    const perUser = flat.members
      .map((m) => ({
        user: { _id: m._id, name: m.name, email: m.email },
        amount: Number((balanceMap.get(String(m._id)) || 0).toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount);


    const me = perUser.find((x) => String(x.user._id) === String(userId));
    const myAmount = me ? me.amount : 0;

    let settlementsForUser = [];
    if (myAmount !== 0) {
      const creditors = perUser.filter((x) => x.amount > 0);
      const debtors = perUser.filter((x) => x.amount < 0);

    
      if (myAmount < 0) {
        // yo debo -> pago a (+)
        let remaining = Math.abs(myAmount);
        for (const c of creditors) {
          if (remaining <= 0) break;
          const pay = Math.min(remaining, c.amount);
          if (pay > 0.009) settlementsForUser.push({ type: "owe", to: c.user, amount: Number(pay.toFixed(2)) });
          remaining -= pay;
        }
      } else {
        // yo recibo -> recibo de (-)
        let remaining = myAmount;
        for (const d of debtors) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, Math.abs(d.amount));
          if (take > 0.009) settlementsForUser.push({ type: "receive", from: d.user, amount: Number(take.toFixed(2)) });
          remaining -= take;
        }
      }
    }

    res.json({
      perUser,
      me: { userId, amount: Number(myAmount.toFixed(2)) },
      settlementsForUser,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
