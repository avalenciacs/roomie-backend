const mongoose = require("mongoose");
const { Schema } = mongoose;

const CATEGORY_ENUM = [
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
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },

    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    splitBetween: [{ type: Schema.Types.ObjectId, ref: "User" }],

    date: { type: Date, default: Date.now },

    category: { type: String, enum: CATEGORY_ENUM, default: "general" },
    notes: { type: String, trim: true, default: "" },

    // ✅ opcional
    imageUrl: { type: String, default: "" },

    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// ✅ evita OverwriteModelError en hot reload
const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

module.exports = Expense;
module.exports.CATEGORY_ENUM = CATEGORY_ENUM;
