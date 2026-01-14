const router = require("express").Router();

const Task = require("../models/Task.model");
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

// CREATE task (por flat)
router.post("/flats/:flatId/tasks", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const { title, description, assignedTo, status, dueDate } = req.body;

    const task = await Task.create({
      flat: flatId,
      title,
      description,
      assignedTo: assignedTo || null,
      status: status || "todo",
      dueDate: dueDate || null,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// READ tasks by flat
router.get("/flats/:flatId/tasks", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const tasks = await Task.find({ flat: flatId })
      .populate("assignedTo", "email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// UPDATE task (title/description/assignedTo/status/dueDate)
router.put("/tasks/:taskId", isAuthenticated, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.payload._id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const check = await ensureMember(task.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const updated = await Task.findByIdAndUpdate(taskId, req.body, { new: true })
      .populate("assignedTo", "email");

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE task
router.delete("/tasks/:taskId", isAuthenticated, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.payload._id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const check = await ensureMember(task.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    await Task.findByIdAndDelete(taskId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
