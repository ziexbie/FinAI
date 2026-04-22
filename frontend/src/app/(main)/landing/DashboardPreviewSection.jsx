const previewStats = [
  ["Net cashflow", "+$1.1K"],
  ["Savings rate", "24%"],
  ["Runway", "4.8 mo"],
];

const chartBars = ["is-one", "is-two", "is-three", "is-four", "is-five"];

export default function DashboardPreviewSection() {
  return (
    <section className="landing-section dashboard-proof">
      <div className="landing-container dashboard-proof-grid">
        <div className="section-heading">
          <p className="section-kicker">Workspace</p>
          <h2>Built for decisions, not data hoarding.</h2>
          <p>
            The protected dashboard keeps the current period, risk drivers, saved records, and next actions in one
            focused workspace.
          </p>
        </div>

        <div className="dashboard-preview" aria-label="FinAI dashboard preview">
          <div className="preview-header">
            <div>
              <span>April briefing</span>
              <strong>Moderate risk</strong>
            </div>
            <div className="preview-score">
              <span>Score</span>
              <strong>78</strong>
            </div>
          </div>

          <div className="preview-stat-grid">
            {previewStats.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="preview-main-grid">
            <div className="preview-chart" aria-hidden="true">
              {chartBars.map((barClass) => (
                <span className={`preview-bar ${barClass}`} key={barClass} />
              ))}
            </div>

            <div className="preview-action-list">
              <p>Reduce dining spend by 8% this month.</p>
              <p>Keep emergency reserves above 4 months.</p>
              <p>Watch liability pressure before adding new debt.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
