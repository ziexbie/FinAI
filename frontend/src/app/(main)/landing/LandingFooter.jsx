import Link from "next/link";

const footerLinks = [
  { href: "#features", label: "Signals" },
  { href: "#how-it-works", label: "Workflow" },
  { href: "#health-score", label: "Health score" },
  { href: "/signup", label: "Sign up" },
];

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <div>
          <strong>FinAI</strong>
          <p>AI-powered financial intelligence for risk analysis and smarter money decisions.</p>
        </div>

        <nav aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="landing-container landing-copyright">
        Copyright {new Date().getFullYear()} FinAI. All rights reserved.
      </div>
    </footer>
  );
}
