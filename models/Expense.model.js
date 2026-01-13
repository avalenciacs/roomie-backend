const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    splitBetween: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    category: {
      type: String,
      enum: ["groceries", "rent", "bills", "other"],
      default: "other",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("Expense", expenseSchema);
