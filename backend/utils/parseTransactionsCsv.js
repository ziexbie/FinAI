const { Readable } = require("stream");
const csv = require("csv-parser");

const HEADER_ALIASES = {
  date: ["date", "transaction date", "posted date"],
  description: ["description", "details", "merchant", "note"],
  category: ["category", "expense category", "type category"],
  amount: ["amount", "transaction amount", "value"],
  type: ["type", "transaction type", "kind"],
};

const getFieldValue = (row, aliases) => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [String(key || "").trim().toLowerCase(), value]);
  const alias = aliases.find((candidate) => normalizedEntries.some(([key]) => key === candidate));

  if (!alias) {
    return "";
  }

  return normalizedEntries.find(([key]) => key === alias)?.[1] ?? "";
};

const parseAmount = (value) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/[$,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");

  const parsed = Number(normalizedValue);

  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeType = (rawType, amount) => {
  const normalizedType = String(rawType || "").trim().toLowerCase();

  if (["income", "credit", "deposit"].includes(normalizedType)) {
    return "income";
  }

  if (["expense", "debit", "payment"].includes(normalizedType)) {
    return "expense";
  }

  return amount < 0 ? "expense" : "expense";
};

const parseDate = (rawDate) => {
  if (!rawDate) {
    return null;
  }

  const parsedDate = new Date(rawDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const parseTransactionsCsv = async (fileBuffer) =>
  new Promise((resolve, reject) => {
    const transactions = [];

    Readable.from(fileBuffer)
      .pipe(csv())
      .on("data", (row) => {
        const category = String(getFieldValue(row, HEADER_ALIASES.category) || "").trim();
        const amount = parseAmount(getFieldValue(row, HEADER_ALIASES.amount));
        const type = normalizeType(getFieldValue(row, HEADER_ALIASES.type), amount);

        if (!category || Number.isNaN(amount)) {
          return;
        }

        transactions.push({
          date: parseDate(getFieldValue(row, HEADER_ALIASES.date)),
          description: String(getFieldValue(row, HEADER_ALIASES.description) || "").trim(),
          category,
          amount: Math.abs(amount),
          type,
        });
      })
      .on("end", () => resolve(transactions))
      .on("error", reject);
  });

const summarizeTransactions = (transactions = []) => {
  const expenseTotals = new Map();
  let totalExpenses = 0;
  let totalIncome = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
      return;
    }

    totalExpenses += transaction.amount;
    expenseTotals.set(transaction.category, (expenseTotals.get(transaction.category) || 0) + transaction.amount);
  });

  const expenses = Array.from(expenseTotals.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));

  return {
    expenses,
    totalExpenses,
    totalIncome,
  };
};

module.exports = { parseTransactionsCsv, summarizeTransactions };
