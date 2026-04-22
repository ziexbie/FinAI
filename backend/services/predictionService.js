const { getDebtAmount, getEmergencyFund, getTotalExpenses, toNumber } = require("./riskService");

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getPeriodLabel = (record) => {
  if (!record) {
    return "No period";
  }

  if (record.periodType === "yearly") {
    return `Yearly ${record.year}`;
  }

  return `${MONTH_NAMES[(Number(record.month) || 1) - 1]} ${record.year}`;
};

const sortMonthlyRecords = (records = []) =>
  records
    .filter((record) => record.periodType === "monthly" && record.year && record.month)
    .sort((left, right) => Number(left.year) * 12 + Number(left.month) - (Number(right.year) * 12 + Number(right.month)));

const getNextMonth = (record) => {
  const month = Number(record?.month) || new Date().getMonth() + 1;
  const year = Number(record?.year) || new Date().getFullYear();
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    month: nextMonth,
    year: nextYear,
    label: `${MONTH_NAMES[nextMonth - 1]} ${nextYear}`,
  };
};

const movingAverage = (values = [], fallback = 0) => {
  const cleanValues = values.map(toNumber).filter((value) => Number.isFinite(value));

  if (cleanValues.length === 0) {
    return fallback;
  }

  const recentValues = cleanValues.slice(-3);
  return recentValues.reduce((sum, value) => sum + value, 0) / recentValues.length;
};

const linearRegressionPredict = (values = [], fallback = 0) => {
  const cleanValues = values.map(toNumber);

  // Regression needs at least 3 points to avoid overreacting to a single jump.
  if (cleanValues.length < 3) {
    return {
      value: movingAverage(cleanValues, fallback),
      method: cleanValues.length === 0 ? "fallback-current-record" : "moving-average",
    };
  }

  const n = cleanValues.length;
  const xValues = cleanValues.map((_, index) => index + 1);
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / n;
  const yMean = cleanValues.reduce((sum, value) => sum + value, 0) / n;
  const numerator = xValues.reduce((sum, x, index) => sum + (x - xMean) * (cleanValues[index] - yMean), 0);
  const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  const prediction = intercept + slope * (n + 1);

  return {
    value: Math.max(0, prediction),
    method: "linear-regression",
    slope,
  };
};

const getTrendDirection = ({ currentNetCashflow, predictedNetCashflow }) => {
  const tolerance = Math.max(100, Math.abs(currentNetCashflow) * 0.05);

  if (predictedNetCashflow > currentNetCashflow + tolerance) {
    return "improving";
  }

  if (predictedNetCashflow < currentNetCashflow - tolerance) {
    return "worsening";
  }

  return "stable";
};

const buildPrediction = (records = [], selectedRecord = null) => {
  const monthlyRecords = sortMonthlyRecords(records);
  const currentRecord = selectedRecord || monthlyRecords[monthlyRecords.length - 1] || records[records.length - 1] || null;

  if (!currentRecord) {
    return {
      nextPeriod: getNextMonth(null),
      predictedExpenses: 0,
      predictedSavings: 0,
      predictedIncome: 0,
      budgetShortfall: false,
      shortfallAmount: 0,
      trendDirection: "stable",
      method: "no-data",
      confidence: "low",
      explanation: "Add monthly records before prediction can use historical behavior.",
      chartData: [],
    };
  }

  const expenseValues = monthlyRecords.map(getTotalExpenses);
  const savingsValues = monthlyRecords.map((record) => toNumber(record.savings));
  const incomeValues = monthlyRecords.map((record) => toNumber(record.income));
  const expensePrediction = linearRegressionPredict(expenseValues, getTotalExpenses(currentRecord));
  const savingsPrediction = linearRegressionPredict(savingsValues, toNumber(currentRecord.savings));
  const incomePrediction = linearRegressionPredict(incomeValues, toNumber(currentRecord.income));
  const predictedExpenses = Math.round(expensePrediction.value);
  const predictedSavings = Math.round(savingsPrediction.value);
  const predictedIncome = Math.round(incomePrediction.value);
  const currentNetCashflow = toNumber(currentRecord.income) - getTotalExpenses(currentRecord);
  const predictedNetCashflow = predictedIncome - predictedExpenses;
  const budgetShortfall = predictedExpenses > predictedIncome;
  const nextPeriod = getNextMonth(currentRecord);
  const method = expensePrediction.method === "linear-regression" || savingsPrediction.method === "linear-regression"
    ? "linear-regression"
    : expensePrediction.method;
  const confidence = monthlyRecords.length >= 3 ? "medium" : "low";

  const chartData = monthlyRecords.slice(-6).map((record) => ({
    period: getPeriodLabel(record),
    expenses: Math.round(getTotalExpenses(record)),
    savings: Math.round(toNumber(record.savings)),
    predictedExpenses: null,
    predictedSavings: null,
    isPrediction: false,
  }));

  chartData.push({
    period: nextPeriod.label,
    expenses: null,
    savings: null,
    predictedExpenses,
    predictedSavings,
    isPrediction: true,
  });

  return {
    nextPeriod,
    predictedExpenses,
    predictedSavings,
    predictedIncome,
    predictedDebt: Math.round(getDebtAmount(currentRecord)),
    predictedEmergencyFund: Math.round(getEmergencyFund(currentRecord)),
    budgetShortfall,
    shortfallAmount: budgetShortfall ? predictedExpenses - predictedIncome : 0,
    trendDirection: getTrendDirection({ currentNetCashflow, predictedNetCashflow }),
    method,
    confidence,
    explanation:
      monthlyRecords.length >= 3
        ? "Prediction uses simple linear regression over monthly history."
        : "Prediction uses a moving average or current period fallback because fewer than 3 monthly records exist.",
    chartData,
  };
};

module.exports = {
  buildPrediction,
  getPeriodLabel,
  sortMonthlyRecords,
};
