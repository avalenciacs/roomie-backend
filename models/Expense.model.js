const { Schema, model } = require("mongoose");

const EXPENSE_CATEGORIES = [
  "general",
  "rent",
  "food",
  "bills",
  "transport",
  "shopping",
  "entertainment",
  "other",
];

const expenseSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },

    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },

    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: "general",
    },

    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    splitBetween: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    notes: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("Expense", expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
