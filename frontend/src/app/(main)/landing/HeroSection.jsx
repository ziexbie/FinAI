import Link from "next/link";
import Image from "next/image";

const heroMetrics = [
  ["Health score", "78/100"],
  ["Risk outlook", "Moderate"],
  ["Next actions", "3 ready"],
];

const heroSignals = [
  ["Expense load", "42%"],
  ["Runway", "4.8 mo"],
  ["Debt pressure", "Watch"],
];

const heroBars = ["is-one", "is-two", "is-three", "is-four", "is-five", "is-six"];

export default function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <Image
        className="landing-hero-image"
        src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1800&q=80"
        alt="Financial planning documents beside a laptop"
        fill
        priority
        sizes="100vw"
        unoptimized
      />
      <div className="landing-hero-shade" />

      <div className="landing-hero-content">
        <div className="landing-hero-layout">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">AI financial risk manager</p>
            <h1 id="landing-hero-title">Know your financial risk before it becomes a problem.</h1>
            <p>
              FinAI turns income, expenses, savings, debt, and CSV imports into a clear health score with practical next
              actions for each month or year.
            </p>

            <div className="landing-actions">
              <Link className="landing-button landing-button-primary" href="/signup">
                Start tracking
              </Link>
              <Link className="landing-button landing-button-secondary" href="/login">
                Sign in
              </Link>
            </div>

            <div className="landing-proof-row" aria-label="Example FinAI results">
              {heroMetrics.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-hero-product" aria-label="FinAI product preview">
            <div className="hero-product-header">
              <div>
                <span>April risk console</span>
                <strong>Moderate risk</strong>
              </div>
              <div className="hero-product-score">
                <span>Score</span>
                <strong>78</strong>
              </div>
            </div>

            <div className="hero-product-chart" aria-hidden="true">
              {heroBars.map((barClass) => (
                <span className={`hero-product-bar ${barClass}`} key={barClass} />
              ))}
            </div>

            <div className="hero-signal-grid">
              {heroSignals.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="hero-product-actions">
              <p>Cut dining spend by 8% this month.</p>
              <p>Keep reserves above 4 months.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
