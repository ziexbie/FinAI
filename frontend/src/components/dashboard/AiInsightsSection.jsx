const fallbackRecommendations = [
  {
    title: "Add monthly data",
    explanation: "AI insights become useful once FinAI can read income, expenses, savings, debt, and emergency fund.",
    priority: "high",
  },
  {
    title: "Review top expense category",
    explanation: "Your largest spending category will become the first reduction target.",
    priority: "medium",
  },
  {
    title: "Track emergency savings",
    explanation: "Emergency fund coverage helps the app estimate resilience against shortfalls.",
    priority: "medium",
  },
];

const normalizeRecommendation = (recommendation) => {
  if (typeof recommendation === "string") {
    return {
      title: recommendation,
      explanation: "Generated from the current period's financial profile.",
      priority: "medium",
    };
  }

  return {
    ...recommendation,
    priority: recommendation.priority || "medium",
  };
};

export default function AiInsightsSection({ recommendations = [], aiInsights = null, loading = false, error = "" }) {
  const insightRecommendations =
    aiInsights?.actionPlan?.length > 0 ? aiInsights.actionPlan : recommendations;
  const insights = (insightRecommendations.length > 0 ? insightRecommendations : fallbackRecommendations)
    .map(normalizeRecommendation)
    .slice(0, 5);
  const isGeminiPowered = aiInsights?.provider === "gemini";
  const providerLabel = isGeminiPowered
    ? `Gemini ${aiInsights.model || ""}`.trim()
    : aiInsights?.provider === "rule-based-fallback"
      ? "Fallback engine"
      : "Waiting for Gemini";

  return (
    <article className="panel ai-insights-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">AI Insights</p>
          <h3>Gemini financial coach</h3>
        </div>
        <span className={isGeminiPowered ? "meta-chip trend-improving" : "meta-chip"}>
          {providerLabel}
        </span>
      </div>

      {loading ? <div className="dashboard-empty">Asking Gemini to analyze this financial period...</div> : null}
      {error ? <div className="banner error-banner">{error}</div> : null}

      {!loading && aiInsights ? (
        <>
          <div className="forecast-meta">
            <span>{aiInsights.status === "generated" ? "Live AI response" : "Fallback response"}</span>
            <strong>{new Date(aiInsights.generatedAt).toLocaleString()}</strong>
          </div>

          <div className="prediction-card-grid ai-summary-grid">
            <div className="prediction-card">
              <span>Executive summary</span>
              <p>{aiInsights.executiveSummary}</p>
            </div>
            <div className="prediction-card">
              <span>Risk narrative</span>
              <p>{aiInsights.riskNarrative}</p>
            </div>
            <div className="prediction-card">
              <span>Forward outlook</span>
              <p>{aiInsights.outlook}</p>
            </div>
          </div>

          {aiInsights.status === "fallback" && aiInsights.reason ? (
            <div className="banner warning-banner">{aiInsights.reason}</div>
          ) : null}
        </>
      ) : null}

      <div className="ai-insight-list">
        {insights.map((recommendation, index) => (
          <div className={`ai-insight-item ${recommendation.priority || "medium"}-priority`} key={recommendation.title}>
            <span className="insight-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{recommendation.title}</strong>
              <p>{recommendation.explanation}</p>
            </div>
            <span className={`priority-pill ${recommendation.priority || "medium"}`}>
              {recommendation.priority || "medium"}
            </span>
          </div>
        ))}
      </div>

      {aiInsights?.presentationNote ? <p className="analysis-message">{aiInsights.presentationNote}</p> : null}
    </article>
  );
}
