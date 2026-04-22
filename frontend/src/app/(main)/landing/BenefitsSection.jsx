import Image from "next/image";

const benefits = [
  ["Save with context", "See whether savings are improving against income, not just growing in isolation."],
  ["Catch risk earlier", "Spot high expense load and liability pressure while there is still room to adjust."],
  ["Plan by period", "Compare monthly or yearly records without rebuilding the same analysis."],
  ["Keep inputs private", "Work inside an authenticated dashboard with user-specific records."],
];

export default function BenefitsSection() {
  return (
    <section className="landing-section benefit-photo-section">
      <div className="landing-container benefit-photo-grid">
        <div className="benefit-image-panel">
          <Image
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
            alt="Data dashboard glowing on computer screens"
            fill
            sizes="(max-width: 900px) 100vw, 42vw"
            unoptimized
          />
        </div>

        <div className="section-heading">
          <p className="section-kicker">Benefits</p>
          <h2>Calmer planning for people who want an early warning system.</h2>

          <div className="benefit-list">
            {benefits.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
