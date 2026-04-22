import Image from "next/image";

const features = [
  {
    title: "Expense pressure",
    metric: "42%",
    description: "Track category load, income share, and month-to-month drift before habits become debt.",
  },
  {
    title: "AI risk scoring",
    metric: "0-100",
    description: "Translate savings, liabilities, and spending into an easy-to-read stability signal.",
  },
  {
    title: "CSV intake",
    metric: "CSV",
    description: "Upload transaction files and let FinAI structure the period for review.",
  },
  {
    title: "Next actions",
    metric: "3+",
    description: "Turn the score into specific moves around spending, reserves, and loan exposure.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section feature-story-section">
      <div className="landing-container feature-story-layout">
        <div className="section-heading">
          <p className="section-kicker">Signals</p>
          <h2>Financial clarity that feels closer to a risk desk.</h2>
          <p>Each feature is tuned for one question: what needs attention right now?</p>

          <div className="feature-media-panel">
            <Image
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
              alt="Financial charts on a laptop in a dark workspace"
              fill
              sizes="(max-width: 900px) 100vw, 44vw"
              unoptimized
            />
            <div className="feature-media-caption">
              <span>Live signal map</span>
              <strong>Expenses, reserves, debt</strong>
            </div>
          </div>
        </div>

        <div className="feature-grid feature-signal-stack">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong className="feature-metric">{feature.metric}</strong>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
