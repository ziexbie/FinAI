const FinancialData = require("../models/FinancialData");
const analyzeFinancialRisk = require("../utils/analyzeFinancialRisk");
const { parseTransactionsCsv, summarizeTransactions } = require("../utils/parseTransactionsCsv");
const { buildPrediction } = require("../services/predictionService");
const { buildRecommendations } = require("../services/recommendationService");
const { calculateRiskScore, toNumber } = require("../services/riskService");

const isSameUser = (requestedUserId, authenticatedUserId) =>
  String(requestedUserId) === String(authenticatedUserId);

const buildPeriodPayload = ({ periodType = "monthly", year, month }) => {
  const normalizedPeriodType = periodType === "yearly" ? "yearly" : "monthly";
  const normalizedYear = Number(year);
  const normalizedMonth = normalizedPeriodType === "monthly" ? Number(month) : null;

  if (!Number.isInteger(normalizedYear)) {
    return { error: "A valid year is required." };
  }

  if (
    normalizedPeriodType === "monthly" &&
    (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12)
  ) {
    return { error: "A valid month is required for monthly records." };
  }

  return {
    periodType: normalizedPeriodType,
    year: normalizedYear,
    month: normalizedPeriodType === "monthly" ? normalizedMonth : null,
  };
};

const buildRecordPayload = ({
  filter,
  income = 0,
  expenses = [],
  savings = 0,
  investments = 0,
  emergencyFund = null,
  debt = null,
  liabilities = 0,
  loan = 0,
  transactions = null,
}) => {
  const normalizedExpenses = Array.isArray(expenses) ? expenses : [];
  const normalizedLiabilities = toNumber(liabilities);
  const normalizedLoan = toNumber(loan);
  const normalizedDebt = debt === null || debt === undefined || debt === "" ? normalizedLiabilities + normalizedLoan : toNumber(debt);
  const normalizedSavings = toNumber(savings);

  const payload = {
    ...filter,
    income: toNumber(income),
    expenses: normalizedExpenses,
    totalExpenses: normalizedExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0),
    savings: normalizedSavings,
    investments: toNumber(investments),
    emergencyFund:
      emergencyFund === null || emergencyFund === undefined || emergencyFund === ""
        ? normalizedSavings
        : toNumber(emergencyFund),
    debt: normalizedDebt,
    liabilities: normalizedLiabilities,
    loan: normalizedLoan,
    createdAt: new Date(),
  };

  if (Array.isArray(transactions)) {
    payload.transactions = transactions;
  }

  return payload;
};

const findSelectedRecord = (records = [], { periodType, year, month } = {}) => {
  if (periodType && year) {
    const selectedRecord = records.find((record) => {
      const samePeriodType = record.periodType === periodType;
      const sameYear = String(record.year) === String(year);
      const sameMonth = periodType === "monthly" ? String(record.month) === String(month) : true;
      return samePeriodType && sameYear && sameMonth;
    });

    if (selectedRecord) {
      return selectedRecord;
    }
  }

  return records[0] || null;
};

const addFinancialData = async (req, res) => {
  try {
    const {
      userId,
      periodType = "monthly",
      month = null,
      year,
      income = 0,
      expenses = [],
      savings = 0,
      investments = 0,
      emergencyFund = null,
      debt = null,
      liabilities = 0,
      loan = 0,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!isSameUser(userId, req.user.userId)) {
      return res.status(403).json({ message: "You can only create finance data for your own account." });
    }

    const normalizedPeriod = buildPeriodPayload({ periodType, year, month });

    if (normalizedPeriod.error) {
      return res.status(400).json({ message: normalizedPeriod.error });
    }

    const filter = {
      userId,
      periodType: normalizedPeriod.periodType,
      year: normalizedPeriod.year,
      month: normalizedPeriod.month,
    };

    const financialData = await FinancialData.findOneAndUpdate(
      filter,
      buildRecordPayload({
        filter,
        income,
        expenses,
        savings,
        investments,
        emergencyFund,
        debt,
        liabilities,
        loan,
      }),
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      message: "Financial data saved successfully for the selected period.",
      financialData,
    });
  } catch (error) {
    console.error("Add financial data error:", error);
    return res.status(500).json({ message: "Unable to save financial data right now." });
  }
};

const uploadTransactionsCsv = async (req, res) => {
  try {
    const { userId, periodType = "monthly", month = null, year } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "A CSV file is required." });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!isSameUser(userId, req.user.userId)) {
      return res.status(403).json({ message: "You can only upload CSV data for your own account." });
    }

    const normalizedPeriod = buildPeriodPayload({ periodType, year, month });

    if (normalizedPeriod.error) {
      return res.status(400).json({ message: normalizedPeriod.error });
    }

    const transactions = await parseTransactionsCsv(req.file.buffer);

    if (transactions.length === 0) {
      return res.status(400).json({
        message: "No valid transactions were found. Include at least category and amount columns in the CSV.",
      });
    }

    const { expenses, totalExpenses, totalIncome } = summarizeTransactions(transactions);
    const filter = {
      userId,
      periodType: normalizedPeriod.periodType,
      year: normalizedPeriod.year,
      month: normalizedPeriod.month,
    };

    const existingRecord = await FinancialData.findOne(filter);

    const financialData = await FinancialData.findOneAndUpdate(
      filter,
      {
        ...filter,
        income: totalIncome > 0 ? totalIncome : existingRecord?.income || 0,
        expenses,
        transactions,
        totalExpenses,
        savings: existingRecord?.savings || 0,
        investments: existingRecord?.investments || 0,
        emergencyFund: existingRecord?.emergencyFund || existingRecord?.savings || 0,
        debt: existingRecord?.debt || (existingRecord?.liabilities || 0) + (existingRecord?.loan || 0),
        liabilities: existingRecord?.liabilities || 0,
        loan: existingRecord?.loan || 0,
        createdAt: new Date(),
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const analysis = analyzeFinancialRisk({
      income: financialData.income,
      expenses: financialData.expenses,
      savings: financialData.savings,
      investments: financialData.investments,
      emergencyFund: financialData.emergencyFund,
      debt: financialData.debt,
      liabilities: financialData.liabilities,
      loan: financialData.loan,
    });

    return res.status(201).json({
      message: "CSV uploaded successfully and financial totals were recalculated.",
      financialData,
      analysis,
    });
  } catch (error) {
    console.error("CSV upload error:", error);
    return res.status(500).json({ message: "Unable to process the CSV file right now." });
  }
};

const getFinancialDataByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodType, year, month } = req.query;

    if (!isSameUser(id, req.user.userId)) {
      return res.status(403).json({ message: "You can only view your own financial data." });
    }

    const query = { userId: id };

    if (periodType) {
      query.periodType = periodType;
    }

    if (year) {
      query.year = Number(year);
    }

    if (month) {
      query.month = Number(month);
    }

    const financialData = await FinancialData.find(query).sort({
      year: -1,
      month: -1,
      createdAt: -1,
    });

    return res.status(200).json({ financialData });
  } catch (error) {
    console.error("Get financial data error:", error);
    return res.status(500).json({ message: "Unable to fetch financial data right now." });
  }
};

const getFinancialAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodType, year, month } = req.query;

    if (!isSameUser(id, req.user.userId)) {
      return res.status(403).json({ message: "You can only view your own financial analytics." });
    }

    const records = await FinancialData.find({ userId: id }).sort({
      year: -1,
      month: -1,
      createdAt: -1,
    });
    const selectedRecord = findSelectedRecord(records, { periodType, year, month });
    const riskScore = selectedRecord ? calculateRiskScore(selectedRecord) : calculateRiskScore(null);
    const prediction = buildPrediction(records, selectedRecord);
    const recommendations = buildRecommendations({ record: selectedRecord, risk: riskScore, prediction });

    return res.status(200).json({
      selectedRecord,
      history: records,
      riskScore,
      prediction,
      recommendations,
      engine: {
        recommendationMode: "rule-based",
        predictionMode: prediction.method,
      },
    });
  } catch (error) {
    console.error("Get financial analytics error:", error);
    return res.status(500).json({ message: "Unable to generate financial analytics right now." });
  }
};

const getFinancialPredictions = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSameUser(id, req.user.userId)) {
      return res.status(403).json({ message: "You can only view your own predictions." });
    }

    const records = await FinancialData.find({ userId: id }).sort({ year: -1, month: -1, createdAt: -1 });
    return res.status(200).json({ prediction: buildPrediction(records) });
  } catch (error) {
    console.error("Get financial predictions error:", error);
    return res.status(500).json({ message: "Unable to generate predictions right now." });
  }
};

const getFinancialRecommendations = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSameUser(id, req.user.userId)) {
      return res.status(403).json({ message: "You can only view your own recommendations." });
    }

    const records = await FinancialData.find({ userId: id }).sort({ year: -1, month: -1, createdAt: -1 });
    const selectedRecord = records[0] || null;
    const riskScore = selectedRecord ? calculateRiskScore(selectedRecord) : calculateRiskScore(null);
    const prediction = buildPrediction(records, selectedRecord);

    return res.status(200).json({
      recommendations: buildRecommendations({ record: selectedRecord, risk: riskScore, prediction }),
    });
  } catch (error) {
    console.error("Get financial recommendations error:", error);
    return res.status(500).json({ message: "Unable to generate recommendations right now." });
  }
};

const calculateRiskScoreFromPayload = async (req, res) => {
  try {
    return res.status(200).json({ riskScore: calculateRiskScore(req.body) });
  } catch (error) {
    console.error("Calculate risk score error:", error);
    return res.status(500).json({ message: "Unable to calculate risk score right now." });
  }
};

const analyzeFinance = async (req, res) => {
  try {
    const { income = 0, expenses = [], savings = 0, investments = 0, emergencyFund = null, debt = null, liabilities = 0, loan = 0 } = req.body;

    const analysis = analyzeFinancialRisk({
      income,
      expenses,
      savings,
      investments,
      emergencyFund,
      debt,
      liabilities,
      loan,
    });

    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Analyze financial risk error:", error);
    return res.status(500).json({ message: "Unable to analyze financial risk right now." });
  }
};

module.exports = {
  addFinancialData,
  uploadTransactionsCsv,
  getFinancialDataByUser,
  getFinancialAnalytics,
  getFinancialPredictions,
  getFinancialRecommendations,
  calculateRiskScoreFromPayload,
  analyzeFinance,
};
