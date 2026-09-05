"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

export const CountdownTimer = ({ targetDate, className }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // Loading skeleton to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className={cn("flex gap-4 md:gap-8 justify-center opacity-50", className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-20 md:w-24 md:h-32 bg-ink/30 border border-wave/20 animate-pulse mb-2" />
            <div className="w-12 h-4 bg-ink/20 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-16 h-20 md:w-24 md:h-32 bg-ink/50 backdrop-blur-md border-[3px] border-double border-gold/30 text-parchment text-3xl md:text-5xl font-serif font-bold tracking-widest shadow-2xl relative overflow-hidden">
        {/* Subtle noise overlay for texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}>
        </div>
        <span className="relative z-10 drop-shadow-md">{value.toString().padStart(2, "0")}</span>
      </div>
      <span className="mt-4 text-xs md:text-sm uppercase tracking-[0.2em] text-gold/80 font-bold">{label}</span>
    </div>
  );

  return (
    <div className={cn("flex gap-4 md:gap-8 justify-center", className)}>
      <TimeBox value={timeLeft.days} label="Days" />
      <TimeBox value={timeLeft.hours} label="Hours" />
      <TimeBox value={timeLeft.minutes} label="Minutes" />
      <TimeBox value={timeLeft.seconds} label="Seconds" />
    </div>
  );
};
