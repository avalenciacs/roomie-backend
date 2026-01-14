const { Schema, model } = require("mongoose");

const taskSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = model("Task", taskSchema);
