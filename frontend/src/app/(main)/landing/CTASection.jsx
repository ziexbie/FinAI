import Link from "next/link";
import Image from "next/image";

export default function CTASection() {
  return (
    <section className="landing-final-cta">
      <Image
        className="landing-final-image"
        src="https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1800&q=80"
        alt="Financial documents and planning tools on a desk"
        fill
        sizes="100vw"
        unoptimized
      />
      <div className="landing-final-shade" />
      <div className="landing-container">
        <p className="section-kicker">Start</p>
        <h2>Turn the next financial period into a clear risk brief.</h2>
        <p>Use FinAI to capture the numbers, score the risk, and choose the next move with less guesswork.</p>
        <Link className="landing-button landing-button-primary" href="/signup">
          Create account
        </Link>
      </div>
    </section>
  );
}
