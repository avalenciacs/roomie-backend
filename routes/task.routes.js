const router = require("express").Router();

const Task = require("../models/Task.model");
const Flat = require("../models/Flat.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

async function ensureMember(flatId, userId) {
  const flat = await Flat.findById(flatId);
  if (!flat) return { ok: false, status: 404, message: "Flat not found" };

  const isMember = flat.members.map(String).includes(String(userId));
  if (!isMember) return { ok: false, status: 403, message: "Not allowed" };

  return { ok: true, flat };
}

// CREATE task
router.post("/flats/:flatId/tasks", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.payload._id;

    const check = await ensureMember(flatId, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const { title, description, assignedTo } = req.body;

    const task = await Task.create({
      flat: flatId,
      title,
      description: description || "",
      createdBy: userId,
      assignedTo: assignedTo || null,
      status: "pending",
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populated);
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
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// UPDATE task
// reglas:
// - Assign: solo si está libre y solo para ti
// - Start/Done: solo el assignedTo puede cambiar status
router.put("/tasks/:taskId", isAuthenticated, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.payload._id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const check = await ensureMember(task.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const { assignedTo, status, title, description } = req.body;

    // Edición básica (MVP) - si quieres, lo limitamos al creador
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    // Assign to me
    if (assignedTo !== undefined) {
      if (task.assignedTo) return res.status(403).json({ message: "Task already assigned" });
      if (String(assignedTo) !== String(userId)) {
        return res.status(403).json({ message: "You can only assign tasks to yourself" });
      }
      task.assignedTo = assignedTo;
      task.status = "pending";
    }

    // Status change
    if (status !== undefined) {
      if (!task.assignedTo) {
        return res.status(400).json({ message: "Task must be assigned before changing status" });
      }
      if (String(task.assignedTo) !== String(userId)) {
        return res.status(403).json({ message: "Only the assignee can change status" });
      }
      task.status = status; // enum valida
    }

    await task.save();

    const updated = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE task (solo creador)
router.delete("/tasks/:taskId", isAuthenticated, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.payload._id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const check = await ensureMember(task.flat, userId);
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    if (String(task.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Only the creator can delete this task" });
    }

    await Task.findByIdAndDelete(taskId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
