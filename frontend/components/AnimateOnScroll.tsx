"use client";

import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  delay?: string;
  className?: string;
}

export default function AnimateOnScroll({ children, delay = "0ms", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`animate-on-scroll ${className}`} style={{ transitionDelay: delay }}>
      {children}
    </div>
  );
}
