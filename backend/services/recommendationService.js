const { getDebtAmount, getEmergencyFund, getTotalExpenses, toNumber } = require("./riskService");

const buildRecommendation = (title, explanation, priority) => ({
  title,
  explanation,
  priority,
});

const getTopExpense = (expenses = []) =>
  [...expenses].sort((left, right) => toNumber(right.amount) - toNumber(left.amount))[0] || null;

const buildRecommendations = ({ record = null, risk = null, prediction = null } = {}) => {
  if (!record) {
    return [
      buildRecommendation(
        "Add a monthly record",
        "Recommendations become personalized after income, expenses, savings, debt, and emergency fund values exist.",
        "high"
      ),
      buildRecommendation("Upload a CSV", "CSV imports help identify the largest spending categories faster.", "medium"),
      buildRecommendation("Track emergency savings", "Emergency fund data is needed for reserve-risk guidance.", "medium"),
    ];
  }

  const income = toNumber(record.income);
  const totalExpenses = getTotalExpenses(record);
  const debt = getDebtAmount(record);
  const emergencyFund = getEmergencyFund(record);
  const savings = toNumber(record.savings);
  const savingsRate = income > 0 ? savings / income : 0;
  const expenseRatio = income > 0 ? totalExpenses / income : 0;
  const debtRatio = income > 0 ? debt / income : debt > 0 ? 1 : 0;
  const emergencyTarget = totalExpenses * 3;
  const emergencyGap = Math.max(0, emergencyTarget - emergencyFund);
  const topExpense = getTopExpense(record.expenses);
  const recommendations = [];

  if (topExpense) {
    const cutPercent = expenseRatio > 0.85 ? 15 : 10;
    const estimatedSavings = Math.round(toNumber(topExpense.amount) * (cutPercent / 100));
    recommendations.push(
      buildRecommendation(
        `Cut ${topExpense.category} expenses by ${cutPercent}%`,
        `This is the largest category. A ${cutPercent}% cut could free about ${estimatedSavings} next period.`,
        expenseRatio > 0.85 ? "high" : "medium"
      )
    );
  }

  if (emergencyGap > 0) {
    recommendations.push(
      buildRecommendation(
        "Increase emergency fund to cover 3 months",
        `The current emergency fund is below the 3-month target by about ${Math.round(emergencyGap)}.`,
        emergencyFund < totalExpenses ? "high" : "medium"
      )
    );
  }

  if (debtRatio > 0.5) {
    recommendations.push(
      buildRecommendation(
        "Debt ratio is high, reduce loan burden first",
        "Debt is above 50% of monthly income, so extra cash should prioritize the highest-interest obligation.",
        "high"
      )
    );
  } else if (debtRatio > 0.35) {
    recommendations.push(
      buildRecommendation(
        "Hold debt below the warning range",
        "Debt is above 35% of income. Avoid new borrowing until the ratio improves.",
        "medium"
      )
    );
  }

  if (savingsRate < 0.2) {
    recommendations.push(
      buildRecommendation(
        "Raise savings rate toward 20%",
        "Savings are below the target buffer rate, which weakens the financial health score.",
        savingsRate < 0.1 ? "high" : "medium"
      )
    );
  }

  if (prediction?.budgetShortfall) {
    recommendations.push(
      buildRecommendation(
        "Prevent next-month overspending",
        `Predicted expenses are higher than predicted income by about ${Math.round(prediction.shortfallAmount)}.`,
        "high"
      )
    );
  }

  if (risk?.label === "Low" && recommendations.length < 3) {
    recommendations.push(
      buildRecommendation(
        "Keep updating monthly records",
        "The current profile is stable, so consistent monthly records will make trend prediction stronger.",
        "low"
      )
    );
  }

  while (recommendations.length < 3) {
    recommendations.push(
      buildRecommendation(
        "Review spending categories monthly",
        "A quick category review helps catch small increases before they become a budget problem.",
        "low"
      )
    );
  }

  return recommendations.slice(0, 5);
};

module.exports = {
  buildRecommendations,
};
