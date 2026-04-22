export const getTotalExpenses = (record) =>
  (record?.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

export const getDebtAmount = (record) => {
  const explicitDebt = Number(record?.debt || 0);

  if (explicitDebt > 0) {
    return explicitDebt;
  }

  return Number(record?.liabilities || 0) + Number(record?.loan || 0);
};

export const getEmergencyFund = (record) => {
  const emergencyFund = Number(record?.emergencyFund || 0);
  return emergencyFund > 0 ? emergencyFund : Number(record?.savings || 0);
};

export const getSavingsRate = (record) => {
  const income = Number(record?.income || 0);

  if (income <= 0) {
    return 0;
  }

  return Math.round((Number(record?.savings || 0) / income) * 100);
};

export const getExpenseRatio = (record) => {
  const income = Number(record?.income || 0);
  const totalExpenses = getTotalExpenses(record);

  if (income <= 0) {
    return totalExpenses > 0 ? 100 : 0;
  }

  return Math.round((totalExpenses / income) * 100);
};

export const getNetCashflow = (record) => Number(record?.income || 0) - getTotalExpenses(record);

export const getLiquidityMonths = (record) => {
  const totalExpenses = getTotalExpenses(record);

  if (totalExpenses <= 0) {
    return 0;
  }

  return Number((getEmergencyFund(record) / totalExpenses).toFixed(1));
};

export const getRiskPreview = (record) => {
  const income = Number(record?.income || 0);
  const savings = Number(record?.savings || 0);
  const totalExpenses = getTotalExpenses(record);

  if (totalExpenses > income) {
    return {
      riskLevel: "High",
      message: "Expenses are above income, so this period is under immediate spending pressure.",
    };
  }

  if (income > 0 && savings < income * 0.2) {
    return {
      riskLevel: "Medium",
      message: "Savings are below 20% of income, which leaves a thinner safety buffer.",
    };
  }

  return {
    riskLevel: "Low",
    message: "Income covers current spending and savings are above the minimum buffer threshold.",
  };
};

export const getHealthScore = (record) => {
  if (!record) {
    return 0;
  }

  const expenseRatio = getExpenseRatio(record);
  const savingsRate = getSavingsRate(record);
  const liabilities = getDebtAmount(record);
  const income = Number(record?.income || 0);
  const liquidityMonths = getLiquidityMonths(record);
  const liabilityRatio = income > 0 ? Math.round((liabilities / income) * 100) : liabilities > 0 ? 100 : 0;

  let score = 82;

  if (expenseRatio > 100) {
    score -= 34;
  } else if (expenseRatio > 80) {
    score -= 16;
  } else {
    score += 4;
  }

  if (savingsRate < 10) {
    score -= 18;
  } else if (savingsRate < 20) {
    score -= 10;
  } else {
    score += 6;
  }

  if (liabilityRatio > 80) {
    score -= 14;
  } else if (liabilityRatio > 40) {
    score -= 8;
  } else {
    score += 4;
  }

  if (liquidityMonths < 1) {
    score -= 16;
  } else if (liquidityMonths < 3) {
    score -= 8;
  } else {
    score += 4;
  }

  return Math.max(0, Math.min(100, score));
};

export const getRiskDrivers = (record) => {
  if (!record) {
    return [];
  }

  const expenseRatio = getExpenseRatio(record);
  const savingsRate = getSavingsRate(record);
  const liquidityMonths = getLiquidityMonths(record);
  const liabilities = getDebtAmount(record);

  return [
    {
      label: "Spending pressure",
      value: `${expenseRatio}% of income`,
      tone: expenseRatio > 100 ? "high-risk" : expenseRatio > 80 ? "medium-risk" : "low-risk",
      description:
        expenseRatio > 100
          ? "Outflows are above income for this period."
          : expenseRatio > 80
            ? "Expenses are consuming most of the available income."
            : "Spending remains within a sustainable range.",
    },
    {
      label: "Emergency reserve",
      value: `${savingsRate}% savings rate`,
      tone: savingsRate < 20 ? "medium-risk" : "low-risk",
      description:
        savingsRate < 20 ? "Savings are below the target threshold." : "Savings are above the baseline threshold.",
    },
    {
      label: "Liquidity runway",
      value: `${liquidityMonths || 0} months`,
      tone: liquidityMonths < 1 ? "high-risk" : liquidityMonths < 3 ? "medium-risk" : "low-risk",
      description:
        liquidityMonths < 1
          ? "Current savings would not cover one full expense cycle."
          : liquidityMonths < 3
            ? "Cash reserves cover only a short runway."
            : "Available savings provide a stronger runway against volatility.",
    },
    {
      label: "Debt exposure",
      value: liabilities,
      valueType: "currency",
      tone: liabilities > Number(record?.income || 0) ? "medium-risk" : "low-risk",
      description:
        liabilities > Number(record?.income || 0)
          ? "Debt obligations are meaningful relative to reported income."
          : "Debt obligations remain lighter than the current income base.",
    },
  ];
};

export const getAiRecommendations = (record) => {
  if (!record) {
    return [
      "Create a monthly or yearly record so the workspace can start generating personalized financial guidance.",
    ];
  }

  const totalExpenses = getTotalExpenses(record);
  const income = Number(record?.income || 0);
  const savingsRate = getSavingsRate(record);
  const topExpense = [...(record.expenses || [])].sort((left, right) => Number(right.amount || 0) - Number(left.amount || 0))[0];
  const recommendations = [];

  if (totalExpenses > income) {
    recommendations.push("Reduce non-essential categories or increase income because current spending is above income.");
  }

  if (savingsRate < 20) {
    recommendations.push("Move more income into savings until the reserve reaches at least 20% of income.");
  }

  if (topExpense) {
    recommendations.push(`Review ${topExpense.category} first because it is the largest expense category in this record.`);
  }

  if (getDebtAmount(record) > 0) {
    recommendations.push("Track debt-related payments closely so liability pressure does not hide inside normal spending.");
  }

  if (recommendations.length === 0) {
    recommendations.push("The current profile looks stable. Keep updating records monthly to preserve trend visibility.");
  }

  return recommendations;
};

export const getRecentRecords = (records = [], limit = 4) =>
  [...records]
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    .slice(0, limit);
