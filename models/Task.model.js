const mongoose = require("mongoose");
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },

    status: {
      type: String,
      enum: ["pending", "doing", "done"],
      default: "pending",
    },

    // ✅ opcional
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ evita OverwriteModelError en hot reload
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

module.exports = Task;
