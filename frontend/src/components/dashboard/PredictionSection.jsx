const getTrendLabel = (trendDirection) => {
  if (trendDirection === "improving") {
    return "Improving";
  }

  if (trendDirection === "worsening") {
    return "Worsening";
  }

  return "Stable";
};

export default function PredictionSection({ prediction, formatCurrency }) {
  const predictedExpenses = prediction ? formatCurrency(prediction.predictedExpenses || 0) : "Pending";
  const predictedSavings = prediction ? formatCurrency(prediction.predictedSavings || 0) : "Pending";
  const shortfallWarning = prediction?.budgetShortfall
    ? `Possible shortfall of ${formatCurrency(prediction.shortfallAmount || 0)}`
    : "No shortfall warning";
  const modelLabel = prediction?.method ? prediction.method.replace("-", " ") : "Waiting for history";
  const confidenceLabel = prediction?.confidence ? `${prediction.confidence} confidence` : "Add data to improve confidence";

  return (
    <article className="panel prediction-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Prediction Section</p>
          <h3>{prediction?.nextPeriod?.label || "Next period"} forecast</h3>
        </div>
        <span className={`meta-chip trend-${prediction?.trendDirection || "stable"}`}>
          {getTrendLabel(prediction?.trendDirection)}
        </span>
      </div>

      <div className="forecast-meta">
        <span>{modelLabel}</span>
        <strong>{confidenceLabel}</strong>
      </div>

      <div className="prediction-card-grid">
        <div className="prediction-card">
          <span>Predicted expenses</span>
          <strong>{predictedExpenses}</strong>
          <p>Expected outgoing cash for the next period.</p>
        </div>
        <div className="prediction-card">
          <span>Predicted savings</span>
          <strong>{predictedSavings}</strong>
          <p>Projected reserve movement after expenses.</p>
        </div>
        <div className={prediction?.budgetShortfall ? "prediction-card warning" : "prediction-card"}>
          <span>Budget warning</span>
          <strong>{shortfallWarning}</strong>
          <p>{prediction?.budgetShortfall ? "Income may not fully cover planned spending." : "The next period looks covered."}</p>
        </div>
      </div>

      <p>{prediction?.explanation || "Predictions will appear after a monthly record is available."}</p>
    </article>
  );
}
