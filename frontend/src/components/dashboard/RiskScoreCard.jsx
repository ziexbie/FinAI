const fallbackReasons = [
  {
    title: "No score yet",
    description: "Add a financial record so FinAI can explain the risk score.",
  },
];

export default function RiskScoreCard({ riskScore }) {
  const label = riskScore?.label || riskScore?.riskLevel || "Pending";
  const score = Number.isFinite(Number(riskScore?.score)) ? Math.round(Number(riskScore.score)) : null;
  const scoreAngle = `${(score || 0) * 3.6}deg`;
  const reasons = (riskScore?.reasons?.length ? riskScore.reasons : fallbackReasons).slice(0, 3);

  return (
    <article className="panel risk-score-panel">
      <div className="risk-card-layout">
        <div>
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">Risk Score Card</p>
              <h3>{label} risk</h3>
            </div>
          </div>

          <p className="analysis-message">
            {riskScore?.explanation ||
              riskScore?.message ||
              "Create or select a period to calculate a personalized risk score."}
          </p>
        </div>

        <div
          className={label !== "Pending" ? `risk-score-visual ${label.toLowerCase()}-risk` : "risk-score-visual"}
          style={{ "--score-angle": scoreAngle }}
        >
          <div className="risk-score-ring">
            <strong>{score ?? "?"}</strong>
            <span>/100</span>
          </div>
          <span className={label !== "Pending" ? `risk-pill ${label.toLowerCase()}-risk` : "risk-pill"}>
            {label}
          </span>
        </div>
      </div>

      <div className="risk-reason-list">
        {reasons.map((reason) => (
          <div className="risk-reason-item" key={reason.title}>
            <strong>{reason.title}</strong>
            <p>{reason.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
