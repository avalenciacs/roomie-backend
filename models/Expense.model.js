const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },

    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },

    category: { type: String, default: "general" },

    // quién pagó
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // quiénes participan del gasto (split igualitario)
    splitBetween: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],

    // quién creó el gasto (permiso delete)
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    notes: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("Expense", expenseSchema);

