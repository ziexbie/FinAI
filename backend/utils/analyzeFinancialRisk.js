const { calculateRiskScore } = require("../services/riskService");

const analyzeFinancialRisk = (record) => calculateRiskScore(record);

module.exports = analyzeFinancialRisk;
