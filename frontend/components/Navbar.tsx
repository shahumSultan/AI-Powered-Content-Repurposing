"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-zinc-950/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-pink-500">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">ContentFlow</span>
        </a>

        {/* Nav links — desktop only */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            How It Works
          </a>
          {/* <a href="#try-it" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            Try It
          </a> */}
          <a href="#pricing" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            Pricing
          </a>
        </div>

        {/* CTA */}
        <a href="#try-it" className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white">
          Coming Soon →
        </a>
      </div>
    </nav>
  );
}
