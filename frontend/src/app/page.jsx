import BenefitsSection from "@/app/(main)/landing/BenefitsSection";
import CTASection from "@/app/(main)/landing/CTASection";
import DashboardPreviewSection from "@/app/(main)/landing/DashboardPreviewSection";
import FeaturesSection from "@/app/(main)/landing/FeaturesSection";
import HealthScoreSection from "@/app/(main)/landing/HealthScoreSection";
import HeroSection from "@/app/(main)/landing/HeroSection";
import HowItWorksSection from "@/app/(main)/landing/HowItWorksSection";
import LandingFooter from "@/app/(main)/landing/LandingFooter";
import LandingNavbar from "@/app/(main)/landing/LandingNavbar";

export default function HomePage() {
  return (
    <main className="landing-site">
      <LandingNavbar />
      <HeroSection />
      {/* <FeaturesSection /> */}
      {/* <HowItWorksSection /> */}
      {/* <DashboardPreviewSection /> */}
      <HealthScoreSection />
      <BenefitsSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
