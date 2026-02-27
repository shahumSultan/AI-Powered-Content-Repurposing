import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TryItSection from "@/components/TryItSection";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <hr className="section-divider" />
        <FeaturesSection />
        <hr className="section-divider" />
        <HowItWorksSection />
        <hr className="section-divider" />
        {/* <TryItSection /> */}
        <hr className="section-divider" />
        <PricingSection />
      </main>
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-pink-500">
              <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-zinc-100">ContentFlow</span>
            <span className="ml-3 text-sm text-zinc-600">
              Turn any content into a full content pack.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <a href="#features" className="transition hover:text-zinc-400">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-zinc-400">
              Pricing
            </a>
            {/* <a href="#try-it" className="transition hover:text-zinc-400">
              Try It
            </a> */}
            <span>© 2026 ContentFlow - Product of Enigma-Cube</span>
          </div>
        </div>
      </footer>
    </>
  );
}
