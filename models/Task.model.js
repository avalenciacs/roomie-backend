const { Schema, model } = require("mongoose");

const taskSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },

    status: {
      type: String,
      enum: ["pending", "doing", "done"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = model("Task", taskSchema);

