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

  return recommendation;
};

export default function AiInsightsSection({ recommendations = [] }) {
  const insights = (recommendations.length > 0 ? recommendations : fallbackRecommendations)
    .map(normalizeRecommendation)
    .slice(0, 5);

  return (
    <article className="panel ai-insights-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">AI Insights</p>
          <h3>Smart recommendations</h3>
        </div>
      </div>

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
    </article>
  );
}
