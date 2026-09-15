"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OceanCanvas } from "@/components/ui/OceanCanvas";
import { GreekShip } from "@/components/ui/GreekShip";

// Reusing ornamental motifs
const CompassRose = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
    <path d="M50 5 L60 40 L50 95 L40 40 Z" fill="currentColor" opacity="0.8" />
    <path d="M5 50 L40 60 L95 50 L40 40 Z" fill="currentColor" opacity="0.5" />
    <circle cx="50" cy="50" r="8" fill="currentColor" />
  </svg>
);

const GreekKeyDivider = () => (
  <svg width="100%" height="24" viewBox="0 0 1000 24" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="text-gold/30">
    <path d="M0,20 L10,20 L10,4 L30,4 L30,20 L40,20 L40,12 L20,12 L20,16 L36,16 L36,8 L14,8 L14,24 L0,24" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    <pattern id="greek-key" x="0" y="0" width="40" height="24" patternUnits="userSpaceOnUse">
      <path d="M0,20 L10,20 L10,4 L30,4 L30,20 L40,20 L40,12 L20,12 L20,16 L36,16 L36,8 L14,8 L14,24 L0,24" fill="none" stroke="currentColor" strokeWidth="2" />
    </pattern>
    <rect x="0" y="0" width="100%" height="24" fill="url(#greek-key)" />
  </svg>
);

export default function LandingPage() {
  const targetDate = process.env.NEXT_PUBLIC_EVENT_START_DATE || "2026-12-31T20:00:00Z";

  const [isIntroPlaying, setIsIntroPlaying] = useState(true);

  const shipRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsIntroPlaying(false);
      },
    });
    timelineRef.current = tl;

    // Initial animation state
    gsap.set(shipRef.current, { xPercent: -140, opacity: 0, scale: 0.35, yPercent: 5 });
    gsap.set(heroTextRef.current, { opacity: 0, y: 40, filter: "blur(12px)" });
    gsap.set(skipBtnRef.current, { opacity: 0 });

    // Phase 1 (0 – 2.0s): Skip button fades in, ship approaches from horizon
    tl.to(skipBtnRef.current, { opacity: 1, duration: 0.5 }, 0);
    tl.to(shipRef.current, { opacity: 1, xPercent: -90, scale: 0.55, yPercent: 5, duration: 2.0, ease: "power1.out" }, 0);

    // Phase 2 (2.0 – 4.0s): Ship sails forward into full center view
    tl.to(shipRef.current, { xPercent: 0, scale: 0.95, yPercent: 5, duration: 2.0, ease: "power2.out" }, 1.9);

    // Phase 3 (4.0 – 5.5s): Ship sails into background, title and all text reveal gracefully
    tl.to(shipRef.current, { scale: 0.65, opacity: 0.45, yPercent: 25, duration: 1.5, ease: "power2.inOut" }, 3.8);
    tl.to(heroTextRef.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "power2.out" }, 4.1);
    tl.to(skipBtnRef.current, { opacity: 0, duration: 0.4 }, 4.8);

    return () => {
      tl.kill();
    };
  }, []);

  const skipIntro = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    setIsIntroPlaying(false);
    gsap.set(shipRef.current, { xPercent: 0, scale: 0.65, opacity: 0.45, yPercent: 25 });
    gsap.set(heroTextRef.current, { opacity: 1, y: 0, filter: "blur(0px)" });
    gsap.set(skipBtnRef.current, { opacity: 0 });
  };

  return (
    <main className="min-h-screen text-parchment font-serif selection:bg-gold selection:text-ink flex flex-col items-center relative bg-transparent">
      
      {/* Animated Ocean Canvas Background */}
      <OceanCanvas className="z-0" />

      {/* Light Atmospheric Overlay for Crisp Wave Visibility & Sharp Text Contrast */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.3)_0%,rgba(15,23,37,0.65)_70%,rgba(10,16,25,0.90)_100%)] pointer-events-none z-0" />

      {/* Opening Animated Greek Galley Ship */}
      <div
        ref={shipRef}
        className="pointer-events-none fixed left-1/2 top-[52%] z-10 -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ width: "min(65vw, 460px)" }}
      >
        <GreekShip />
      </div>

      {/* Skip Intro Button */}
      {isIntroPlaying && (
        <button
          ref={skipBtnRef}
          onClick={skipIntro}
          className="fixed bottom-6 right-6 z-40 rounded-full border border-gold/30 bg-ink/90 px-4 py-2 text-xs uppercase tracking-widest text-parchment/80 transition-colors hover:border-gold hover:text-gold"
        >
          Skip Intro →
        </button>
      )}

      {/* 1. Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center p-6 md:p-24 overflow-hidden text-center z-20">
        <div className="absolute inset-0 opacity-10 pointer-events-none transform scale-125 md:rotate-12 origin-top-right mix-blend-screen"
             style={{ backgroundImage: 'radial-gradient(circle at center, #2E7D8C 1px, transparent 1px)', backgroundSize: '120px 120px' }}>
             <CompassRose className="absolute top-1/4 right-1/4 w-[400px] h-[400px] md:w-[800px] md:h-[800px] text-parchment animate-pulse" />
        </div>

        <div ref={heroTextRef} className="relative z-20 max-w-4xl space-y-8 md:space-y-12">
          <h1 className="font-serif text-7xl md:text-[10rem] font-normal tracking-tight leading-[0.8] text-gold drop-shadow-[0_10px_45px_rgba(201,162,75,0.5)]">
            NOSTOS
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-3xl text-gold/95 leading-relaxed font-serif italic font-medium drop-shadow-[0_4px_20px_rgba(201,162,75,0.3)]">
            Sail home. Solve your way across ten trials. Live leaderboard. All online.
          </p>
          
          <div className="pt-8">
            <Link href="/register" passHref>
              <Button className="w-full sm:w-auto text-xl md:text-2xl px-12 py-4 shadow-[0_0_35px_rgba(201,162,75,0.4)]">Register Your Crew</Button>
            </Link>
          </div>

        </div>
      </section>

      <div className="w-full max-w-7xl px-4 md:px-12 my-12 z-20">
        <GreekKeyDivider />
      </div>

      {/* 2. How it works — PhonePe Careers Wave Stacking Cards */}
      <section className="w-full max-w-4xl px-6 md:px-12 py-20 z-20 min-h-[160vh]">
        <h2 className="text-4xl md:text-6xl text-gold mb-16 text-center tracking-wide drop-shadow-md">
          The Voyage (How it Works)
        </h2>
        
        <div className="relative space-y-[28vh] pb-[40vh]">
          {/* Card I */}
          <div className="sticky top-[100px] z-10 transition-all duration-300 will-change-transform">
            <div className="bg-[#0B121E] border border-gold/35 p-8 md:p-10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold uppercase tracking-widest">
                    Stage 01
                  </span>
                  <span className="text-4xl font-bold text-gold/70 sm:hidden">I.</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl text-parchment font-bold">Register Your Crew</h3>
                  <p className="text-base md:text-lg text-parchment/80 leading-relaxed">
                    Gather your bravest sailors. You will need a unified crew to face the trials ahead. Name your ship and secure your passage before the winds change.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card II */}
          <div className="sticky top-[116px] z-20 transition-all duration-300 will-change-transform">
            <div className="bg-[#0D1626] border border-wave/45 p-8 md:p-10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-wave to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-wave/20 border border-wave/50 text-wave-light text-xs font-bold uppercase tracking-widest">
                    Stage 02
                  </span>
                  <span className="text-4xl font-bold text-gold/70 sm:hidden">II.</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl text-parchment font-bold">Log In Together</h3>
                  <p className="text-base md:text-lg text-parchment/80 leading-relaxed">
                    When the time comes, assemble your crew online. You will navigate the treacherous waters together in real-time, sharing discoveries across your devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card III */}
          <div className="sticky top-[132px] z-30 transition-all duration-300 will-change-transform">
            <div className="bg-[#09101C] border border-gold/45 p-8 md:p-10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.92)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold uppercase tracking-widest">
                    Stage 03
                  </span>
                  <span className="text-4xl font-bold text-gold/70 sm:hidden">III.</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl text-parchment font-bold">Solve Ten Trials</h3>
                  <p className="text-base md:text-lg text-parchment/80 leading-relaxed">
                    Navigate through three harrowing rounds, facing sirens, cyclopes, and the wrath of the gods. Only wit and cooperation will unlock the path home.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card IV */}
          <div className="sticky top-[148px] z-40 transition-all duration-300 will-change-transform">
            <div className="bg-[#050A12] border border-wave/60 p-8 md:p-10 rounded-2xl shadow-[0_-25px_55px_rgba(0,0,0,0.96)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/50 text-gold text-xs font-bold uppercase tracking-widest">
                    Stage 04
                  </span>
                  <span className="text-4xl font-bold text-gold/70 sm:hidden">IV.</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl text-parchment font-bold">Ascend the Leaderboard</h3>
                  <p className="text-base md:text-lg text-parchment/80 leading-relaxed">
                    Watch your ship climb the live ranks as you solve puzzles. Will you be the first to reach the shores of Ithaca?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Rules Summary — PhonePe Wave Stacking Cards */}
      <section className="w-full max-w-4xl px-6 md:px-12 py-24 relative z-30 min-h-[140vh]">
        <h2 className="text-4xl md:text-6xl text-gold text-center tracking-wide drop-shadow-md mb-16">
          The Edicts (Rules)
        </h2>
        
        <div className="relative space-y-[28vh] pb-[40vh]">
          {/* Rule 1 */}
          <div className="sticky top-[100px] z-10 transition-all duration-300 will-change-transform">
            <div className="bg-[#0B121E] border border-parchment/30 p-8 md:p-10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold uppercase tracking-widest shrink-0">
                  Edict 01
                </span>
                <p className="text-lg md:text-xl text-parchment/90 leading-relaxed">
                  <strong>Team Composition:</strong> A worthy vessel requires a crew of 3 to 4 members. No more, no less.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="sticky top-[116px] z-20 transition-all duration-300 will-change-transform">
            <div className="bg-[#0D1626] border border-wave/40 p-8 md:p-10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-wave to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <span className="px-3 py-1 rounded-full bg-wave/20 border border-wave/50 text-wave-light text-xs font-bold uppercase tracking-widest shrink-0">
                  Edict 02
                </span>
                <p className="text-lg md:text-xl text-parchment/90 leading-relaxed">
                  <strong>Format:</strong> The entire odyssey is fully online. You may communicate through any means you wish, but the trials will unfold directly on your devices.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="sticky top-[132px] z-30 transition-all duration-300 will-change-transform">
            <div className="bg-[#050A12] border border-gold/50 p-8 md:p-10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.95)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/50 text-gold text-xs font-bold uppercase tracking-widest shrink-0">
                  Edict 03
                </span>
                <p className="text-lg md:text-xl text-parchment/90 leading-relaxed">
                  <strong>The Victor:</strong> Glory is awarded based on levels cleared. Ties are broken by the fastest overall time, and finally, by the fewest incorrect attempts. Choose your answers wisely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full border-t border-parchment/20 bg-ink/95 backdrop-blur-md relative z-40 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <p className="text-gold tracking-[0.2em] uppercase text-sm font-bold">Event Coordinators</p>
            <p className="text-parchment/60 text-lg">Dayananda J & Induja E</p>
          </div>

          <CompassRose className="w-12 h-12 text-gold/30" />

          <div className="text-center md:text-right">
            <Link href="/login" className="text-parchment/60 hover:text-gold transition-colors text-lg italic border-b border-transparent hover:border-gold pb-1">
              Returning crews, log in here.
            </Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
