"use client";

import { useEffect, useState } from "react";

interface WelcomeAnimationProps {
  userId: string;
  firstName: string;
  onComplete: () => void;
}

type AnimState = "idle" | "bg" | "logo" | "name" | "tagline" | "done";

export function WelcomeAnimation({ userId, firstName, onComplete }: WelcomeAnimationProps) {
  const [state, setState] = useState<AnimState>("idle");

  useEffect(() => {
    const key = `welcome_shown_${userId}`;
    const shown = localStorage.getItem(key);

    if (shown) {
      onComplete();
      return;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      localStorage.setItem(key, "true");
      onComplete();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setState("bg"), 300));
    timers.push(setTimeout(() => setState("logo"), 800));
    timers.push(setTimeout(() => setState("name"), 1500));
    timers.push(setTimeout(() => setState("tagline"), 2200));
    timers.push(setTimeout(() => setState("done"), 3500));
    timers.push(setTimeout(() => {
      localStorage.setItem(key, "true");
      onComplete();
    }, 4000));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center
        transition-opacity duration-500
        ${state === "done" ? "opacity-0 pointer-events-none" : "opacity-100"}
      `}
    >
      {/* Background subtil */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: "url('/welcome-bg.webp')",
          opacity: state === "bg" || state === "logo" || state === "name" || state === "tagline" ? 0.08 : 0,
        }}
      />

      {/* Contenu centré */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        {/* Logo */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: state === "logo" || state === "name" || state === "tagline" ? 1 : 0,
            transform: state === "name" || state === "tagline" ? "translateY(-8px)" : "translateY(0)",
          }}
        >
          <img src="/logo alpact studio.svg" alt="Alpact Studio" className="h-10 w-auto opacity-60" />
        </div>

        {/* Prénom */}
        <div
          className="transition-all duration-600"
          style={{
            opacity: state === "name" || state === "tagline" ? 1 : 0,
            transform: state === "name" || state === "tagline" ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <h1 className="font-serif text-5xl text-fg">
            Bienvenue, {firstName}.
          </h1>
        </div>

        {/* Tagline */}
        <div
          className="transition-all duration-600"
          style={{
            opacity: state === "tagline" ? 1 : 0,
            transform: state === "tagline" ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <p className="font-sans text-lg text-muted">
            Votre espace de pilotage est prêt.
          </p>
        </div>
      </div>
    </div>
  );
}
