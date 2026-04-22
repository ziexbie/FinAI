"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={scrolled ? "landing-navbar is-scrolled" : "landing-navbar"}>
      <div className="landing-nav-inner">
        <Link className="landing-brand" href="/">
          FinAI <span>Risk intelligence</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Landing navigation">
          <a href="#features">Signals</a>
          <a href="#how-it-works">Workflow</a>
          <a href="#health-score">Health score</a>
          <Link href="/login">Login</Link>
        </nav>

        <Link className="landing-nav-cta" href="/app">
          Open workspace
        </Link>
      </div>
    </header>
  );
}
