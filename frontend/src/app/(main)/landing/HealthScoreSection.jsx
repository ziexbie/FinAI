const scoreFactors = ["Savings runway", "Expense load", "Debt pressure"];

export default function HealthScoreSection() {
  return (
    <section id="health-score" className="landing-section">
      <div className="landing-container health-score-grid">
        <div className="section-heading">
          <p className="section-kicker">Health score</p>
          <h2>One signal for income, savings, expenses, and debt.</h2>
          <p>
            FinAI keeps the score interpretable, so a user can see whether the period is stable, drifting, or demanding
            attention.
          </p>
        </div>

        <div className="health-score-panel">
          <div className="score-meter">
            <strong>78</strong>
            <span>of 100</span>
          </div>
          <div>
            <p className="risk-label">Moderate risk</p>
            <p>
              Spending remains manageable, but savings and liability pressure should be watched before the next record.
            </p>
            <div className="score-factor-list" aria-label="Health score factors">
              {scoreFactors.map((factor) => (
                <span key={factor}>{factor}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
