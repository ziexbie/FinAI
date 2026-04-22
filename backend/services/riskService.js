const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTotalExpenses = (record = {}) => {
  record = record || {};

  if (toNumber(record.totalExpenses) > 0) {
    return toNumber(record.totalExpenses);
  }

  return (record.expenses || []).reduce((sum, expense) => sum + toNumber(expense.amount), 0);
};

const getDebtAmount = (record = {}) => {
  record = record || {};

  const explicitDebt = toNumber(record.debt);

  if (explicitDebt > 0) {
    return explicitDebt;
  }

  return toNumber(record.liabilities) + toNumber(record.loan);
};

const getEmergencyFund = (record = {}) => {
  record = record || {};

  const emergencyFund = toNumber(record.emergencyFund);
  return emergencyFund > 0 ? emergencyFund : toNumber(record.savings);
};

const buildReason = (title, description, impact, points) => ({
  title,
  description,
  impact,
  points,
});

const getRiskLabel = (score) => {
  if (score >= 66) {
    return "High";
  }

  if (score >= 36) {
    return "Medium";
  }

  return "Low";
};

const calculateRiskScore = (record = {}) => {
  record = record || {};

  const income = toNumber(record.income);
  const savings = toNumber(record.savings);
  const investments = toNumber(record.investments);
  const totalExpenses = getTotalExpenses(record);
  const debt = getDebtAmount(record);
  const emergencyFund = getEmergencyFund(record);
  const expenseRatio = income > 0 ? totalExpenses / income : totalExpenses > 0 ? 1 : 0;
  const savingsRate = income > 0 ? savings / income : 0;
  const debtToIncomeRatio = income > 0 ? debt / income : debt > 0 ? 1 : 0;
  const emergencyMonths = totalExpenses > 0 ? emergencyFund / totalExpenses : emergencyFund > 0 ? 6 : 0;
  const investmentToIncomeRatio = income > 0 ? investments / income : investments > 0 ? 1 : 0;
  const reasons = [];
  let score = 0;

  if (income <= 0 && totalExpenses > 0) {
    score += 25;
    reasons.push(
      buildReason(
        "Missing income baseline",
        "Expenses exist but income is zero, so the app cannot confirm that spending is covered.",
        "high",
        25
      )
    );
  }

  if (expenseRatio > 1) {
    score += 30;
    reasons.push(
      buildReason(
        "Expenses exceed income",
        "Monthly expenses are higher than income, which creates an immediate budget shortfall risk.",
        "high",
        30
      )
    );
  } else if (expenseRatio > 0.85) {
    score += 22;
    reasons.push(
      buildReason(
        "High expense load",
        "Expenses use more than 85% of income, leaving very little room for savings or shocks.",
        "high",
        22
      )
    );
  } else if (expenseRatio > 0.7) {
    score += 12;
    reasons.push(
      buildReason(
        "Tight spending margin",
        "Expenses are above 70% of income, so the period should be monitored closely.",
        "medium",
        12
      )
    );
  }

  if (savingsRate < 0.1) {
    score += 18;
    reasons.push(
      buildReason(
        "Low savings rate",
        "Savings are below 10% of income, which slows emergency fund growth.",
        "high",
        18
      )
    );
  } else if (savingsRate < 0.2) {
    score += 10;
    reasons.push(
      buildReason(
        "Savings below target",
        "Savings are below the 20% target used for a healthier buffer.",
        "medium",
        10
      )
    );
  }

  if (debtToIncomeRatio > 1) {
    score += 18;
    reasons.push(
      buildReason(
        "Debt is above income",
        "Reported debt is greater than monthly income, which can limit flexibility.",
        "high",
        18
      )
    );
  } else if (debtToIncomeRatio > 0.5) {
    score += 12;
    reasons.push(
      buildReason(
        "Debt ratio is high",
        "Debt is above 50% of income, so reducing loan burden should be prioritized.",
        "high",
        12
      )
    );
  } else if (debtToIncomeRatio > 0.35) {
    score += 7;
    reasons.push(
      buildReason(
        "Debt needs monitoring",
        "Debt is above 35% of income and should be watched before taking on new obligations.",
        "medium",
        7
      )
    );
  }

  if (emergencyMonths < 1) {
    score += 18;
    reasons.push(
      buildReason(
        "Emergency fund is thin",
        "Emergency savings cover less than one month of expenses.",
        "high",
        18
      )
    );
  } else if (emergencyMonths < 3) {
    score += 10;
    reasons.push(
      buildReason(
        "Emergency fund below 3 months",
        "Emergency savings do not yet cover the recommended 3 months of expenses.",
        "medium",
        10
      )
    );
  }

  if (investmentToIncomeRatio > 0.8 && emergencyMonths < 3) {
    score += 6;
    reasons.push(
      buildReason(
        "Investment exposure before reserves",
        "Investments are high compared with income while emergency reserves are still below 3 months.",
        "medium",
        6
      )
    );
  }

  const riskScore = clamp(Math.round(score), 0, 100);
  const riskLabel = getRiskLabel(riskScore);
  const explanation =
    reasons.length > 0
      ? reasons
          .slice(0, 3)
          .map((reason) => reason.description)
          .join(" ")
      : "Income covers spending, savings are healthy, debt pressure is low, and the emergency buffer looks stable.";

  return {
    score: riskScore,
    healthScore: 100 - riskScore,
    label: riskLabel,
    riskLevel: riskLabel,
    explanation,
    message: explanation,
    reasons: reasons.slice(0, 4),
    metrics: {
      income,
      totalExpenses,
      savings,
      investments,
      debt,
      emergencyFund,
      expenseRatio: Number(expenseRatio.toFixed(2)),
      savingsRate: Number(savingsRate.toFixed(2)),
      debtToIncomeRatio: Number(debtToIncomeRatio.toFixed(2)),
      emergencyMonths: Number(emergencyMonths.toFixed(1)),
    },
  };
};

module.exports = {
  calculateRiskScore,
  getDebtAmount,
  getEmergencyFund,
  getTotalExpenses,
  toNumber,
};
