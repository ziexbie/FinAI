const { buildRecommendations } = require("./recommendationService");
const { buildPrediction } = require("./predictionService");
const { calculateRiskScore } = require("./riskService");

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 4096);

const insightSchema = {
  type: "OBJECT",
  properties: {
    executiveSummary: {
      type: "STRING",
    },
    riskNarrative: {
      type: "STRING",
    },
    outlook: {
      type: "STRING",
    },
    actionPlan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: {
            type: "STRING",
          },
          explanation: {
            type: "STRING",
          },
          priority: {
            type: "STRING",
          },
        },
        required: ["title", "explanation", "priority"],
        propertyOrdering: ["title", "explanation", "priority"],
      },
    },
    presentationNote: {
      type: "STRING",
    },
  },
  required: ["executiveSummary", "riskNarrative", "outlook", "actionPlan", "presentationNote"],
  propertyOrdering: ["executiveSummary", "riskNarrative", "outlook", "actionPlan", "presentationNote"],
};

const sanitizeExpense = (expense = {}) => ({
  category: expense.category,
  amount: Number(expense.amount || 0),
});

const sanitizeRecord = (record = {}) => ({
  periodType: record.periodType,
  month: record.month,
  year: record.year,
  income: Number(record.income || 0),
  totalExpenses: Number(record.totalExpenses || 0),
  expenses: (record.expenses || []).map(sanitizeExpense),
  savings: Number(record.savings || 0),
  investments: Number(record.investments || 0),
  emergencyFund: Number(record.emergencyFund || record.savings || 0),
  debt: Number(record.debt || 0),
  liabilities: Number(record.liabilities || 0),
  loan: Number(record.loan || 0),
});

const normalizePriority = (priority = "medium") => {
  const normalized = String(priority).trim().toLowerCase();

  if (["high", "medium", "low"].includes(normalized)) {
    return normalized;
  }

  return "medium";
};

const normalizeInsightPayload = (payload, fallbackRecommendations) => ({
  executiveSummary:
    payload?.executiveSummary ||
    "FinAI could not produce a full Gemini summary, so the dashboard is showing a conservative fallback.",
  riskNarrative:
    payload?.riskNarrative ||
    "The fallback risk engine is using income, expenses, savings, debt, and emergency fund signals.",
  outlook:
    payload?.outlook ||
    "Add more monthly records to improve prediction quality and make the AI outlook more specific.",
  actionPlan: (Array.isArray(payload?.actionPlan) && payload.actionPlan.length > 0
    ? payload.actionPlan
    : fallbackRecommendations
  )
    .slice(0, 5)
    .map((item) =>
      typeof item === "string"
        ? {
          title: item,
          explanation: "Generated from the current financial risk profile.",
          priority: "medium",
        }
        : {
          title: item.title || "Review financial plan",
          explanation: item.explanation || "Use this as a practical next step for the selected period.",
          priority: normalizePriority(item.priority),
        }
    ),
  presentationNote:
    payload?.presentationNote ||
    "This insight can be explained as an AI-generated financial coaching layer powered by Gemini.",
});

const buildFallbackInsights = ({ record, risk, prediction, recommendations, reason }) => ({
  provider: "rule-based-fallback",
  model: null,
  generatedAt: new Date().toISOString(),
  status: "fallback",
  reason,
  ...normalizeInsightPayload(
    {
      executiveSummary: record
        ? `${risk.label} risk detected for the selected period with a ${risk.healthScore}/100 health score.`
        : "No saved finance record is selected yet.",
      riskNarrative: risk.explanation,
      outlook: prediction.explanation,
      actionPlan: recommendations,
      presentationNote:
        "Gemini is not active for this response. Add GEMINI_API_KEY in the backend environment to enable live AI insights.",
    },
    recommendations
  ),
});

const extractText = (responseBody = {}) => {
  const parts = responseBody.candidates?.[0]?.content?.parts || [];

  // Gemini schema responses return JSON directly in the text field
  if (parts.length > 0 && parts[0].text) {
    return parts[0].text.trim();
  }

  return "";
};

const parseGeminiJson = (text) => {
  if (!text) {
    throw new Error("Gemini returned an empty response. Check if your API key is valid.");
  }

  // First, try direct parsing (for schema responses)
  try {
    return JSON.parse(text);
  } catch (directError) {
    // If direct parse fails, try to extract JSON
    // Use a more conservative approach: find first { and match braces properly
    const startIdx = text.indexOf("{");
    if (startIdx === -1) {
      throw new Error(
        `No JSON object found in Gemini response.\n` +
        `Response preview: ${text.substring(0, 150)}`
      );
    }

    // Find the matching closing brace
    let braceCount = 0;
    let endIdx = -1;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") braceCount++;
      if (text[i] === "}") braceCount--;
      if (braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }

    if (endIdx === -1) {
      const incompleteJsonError = new Error(
        `Incomplete JSON object in Gemini response (unmatched braces).\n` +
        `Response preview: ${text.substring(0, 150)}`
      );
      incompleteJsonError.code = "INCOMPLETE_GEMINI_JSON";
      throw incompleteJsonError;
    }

    const jsonStr = text.substring(startIdx, endIdx);
    try {
      return JSON.parse(jsonStr);
    } catch (extractError) {
      throw new Error(
        `Failed to parse extracted JSON: ${extractError.message}\n` +
        `Extracted JSON: ${jsonStr.substring(0, 150)}`
      );
    }
  }
};

const buildPrompt = ({ record, risk, prediction, recommendations, compact = false }) => `
You are FinAI, an AI financial risk coach for a college final year project.
Analyze the selected finance record and produce concise, presentation-friendly guidance.

Rules:
- Do not claim to be a licensed financial advisor.
- Use only the provided data.
- Keep the tone practical and confident.
- Make action items specific to the user's numbers.
- Use high, medium, or low for every action priority.
- Return short JSON values only. No markdown.
- Keep executiveSummary, riskNarrative, outlook, and presentationNote under 35 words each.
- Return exactly 3 actionPlan items, each explanation under 20 words.

Selected financial data:
${JSON.stringify(sanitizeRecord(record), null, 2)}

Computed risk engine output:
${JSON.stringify(compact ? {
  score: risk.score,
  healthScore: risk.healthScore,
  label: risk.label,
  explanation: risk.explanation,
  metrics: risk.metrics,
} : risk, null, 2)}

Prediction engine output:
${JSON.stringify(compact ? {
  nextPeriod: prediction.nextPeriod,
  predictedExpenses: prediction.predictedExpenses,
  predictedSavings: prediction.predictedSavings,
  predictedIncome: prediction.predictedIncome,
  budgetShortfall: prediction.budgetShortfall,
  shortfallAmount: prediction.shortfallAmount,
  trendDirection: prediction.trendDirection,
  method: prediction.method,
  confidence: prediction.confidence,
  explanation: prediction.explanation,
} : prediction, null, 2)}

Baseline recommendation candidates:
${JSON.stringify(recommendations, null, 2)}
`;

const requestGeminiGeneration = async ({
  record,
  risk,
  prediction,
  recommendations,
  model,
  compact,
  maxOutputTokens,
}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt({ record, risk, prediction, recommendations, compact }) }],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: insightSchema,
        },
      }),
    });

    const responseBody = await response.json().catch((parseErr) => {
      console.error("Failed to parse Gemini response as JSON:", parseErr);
      return { error: { message: "Invalid JSON response from Gemini API" } };
    });

    if (!response.ok) {
      const errorMsg = responseBody.error?.message || `Gemini API request failed with status ${response.status}.`;
      console.error("Gemini API Error:", {
        status: response.status,
        error: errorMsg,
        fullResponse: JSON.stringify(responseBody).substring(0, 500),
      });
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    const finishReason = responseBody.candidates?.[0]?.finishReason;
    const extractedText = extractText(responseBody);

    if (!extractedText) {
      console.error("No text extracted from Gemini response:", JSON.stringify(responseBody).substring(0, 300));
      throw new Error("Gemini returned a response but no text content was found");
    }

    try {
      return parseGeminiJson(extractedText);
    } catch (parseError) {
      if (finishReason === "MAX_TOKENS") {
        parseError.code = "INCOMPLETE_GEMINI_JSON";
      }

      throw parseError;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Gemini API request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const callGemini = async ({ record, risk, prediction, recommendations }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the backend environment.");
  }

  const attempts = [
    { compact: false, maxOutputTokens: MAX_OUTPUT_TOKENS },
    { compact: true, maxOutputTokens: MAX_OUTPUT_TOKENS },
  ];
  let lastError = null;

  for (let index = 0; index < attempts.length; index++) {
    const attempt = attempts[index];

    try {
      const payload = await requestGeminiGeneration({
        record,
        risk,
        prediction,
        recommendations,
        model,
        compact: attempt.compact,
        maxOutputTokens: attempt.maxOutputTokens,
      });

      return { payload, model };
    } catch (error) {
      lastError = error;

      if (error.code !== "INCOMPLETE_GEMINI_JSON") {
        throw error;
      }

      if (index < attempts.length - 1) {
        console.warn("Gemini returned incomplete JSON. Retrying with compact prompt.");
      }
    }
  }

  throw lastError;
};

const getUserFacingGeminiError = (error) => {
  if (error.code === "INCOMPLETE_GEMINI_JSON") {
    return "Gemini returned a partial response, so FinAI used the local fallback insights for this refresh.";
  }

  return error.message;
};

const generateFinancialInsights = async ({ record, records = [] }) => {
  const selectedRecord = record || null;
  const risk = calculateRiskScore(selectedRecord);
  const prediction = buildPrediction(records, selectedRecord);
  const recommendations = buildRecommendations({ record: selectedRecord, risk, prediction });

  try {
    const { payload, model } = await callGemini({
      record: selectedRecord,
      risk,
      prediction,
      recommendations,
    });

    return {
      provider: "gemini",
      model,
      generatedAt: new Date().toISOString(),
      status: "generated",
      ...normalizeInsightPayload(payload, recommendations),
    };
  } catch (error) {
    console.error("Gemini insight generation failed:", error.message);
    return buildFallbackInsights({
      record: selectedRecord,
      risk,
      prediction,
      recommendations,
      reason: getUserFacingGeminiError(error),
    });
  }
};

module.exports = {
  generateFinancialInsights,
};
