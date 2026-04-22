const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      required: [true, "Expense category is required."],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required."],
      min: [0, "Expense amount cannot be negative."],
    },
  },
  { _id: false }
);

const transactionSchema = new Schema(
  {
    date: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Transaction category is required."],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required."],
      min: [0, "Transaction amount cannot be negative."],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      default: "expense",
    },
  },
  { _id: false }
);

const financialDataSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
    },
    periodType: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
      required: true,
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    year: {
      type: Number,
      required: [true, "Year is required."],
      min: [2000, "Year must be 2000 or later."],
    },
    income: {
      type: Number,
      default: 0,
      min: [0, "Income cannot be negative."],
    },
    expenses: {
      type: [expenseSchema],
      default: [],
    },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    totalExpenses: {
      type: Number,
      default: 0,
      min: [0, "Total expenses cannot be negative."],
    },
    savings: {
      type: Number,
      default: 0,
      min: [0, "Savings cannot be negative."],
    },
    investments: {
      type: Number,
      default: 0,
      min: [0, "Investments cannot be negative."],
    },
    emergencyFund: {
      type: Number,
      default: 0,
      min: [0, "Emergency fund cannot be negative."],
    },
    debt: {
      type: Number,
      default: 0,
      min: [0, "Debt cannot be negative."],
    },
    liabilities: {
      type: Number,
      default: 0,
      min: [0, "Liabilities cannot be negative."],
    },
    loan: {
      type: Number,
      default: 0,
      min: [0, "Loan amount cannot be negative."],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

financialDataSchema.index(
  { userId: 1, periodType: 1, year: 1, month: 1 },
  { unique: true }
);

module.exports = model("FinancialData", financialDataSchema);
