import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Capture the period",
    text: "Choose monthly or yearly scope, then enter your summary values or import a CSV.",
  },
  {
    number: "02",
    title: "Read the pressure points",
    text: "FinAI evaluates spending load, liquidity runway, savings rate, debt, and category mix.",
  },
  {
    number: "03",
    title: "Act from the score",
    text: "Review the health score, risk label, and recommendations before the next period starts.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="landing-section workflow-showcase-section">
      <div className="landing-container workflow-showcase-grid">
        <div>
          <div className="section-heading">
            <p className="section-kicker">Workflow</p>
            <h2>From raw numbers to a risk brief in three steps.</h2>
            <p>Inputs stay simple, while the dashboard turns the period into a decision-ready view.</p>
          </div>

          <div className="process-list">
            {steps.map((step) => (
              <article className="process-step" key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="workflow-photo-panel">
          <Image
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
            alt="Financial planning paperwork and calculator on a desk"
            fill
            sizes="(max-width: 900px) 100vw, 38vw"
            unoptimized
          />
          <div className="workflow-photo-overlay">
            <span>Period review</span>
            <strong>Monthly data becomes a clear operating brief.</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
