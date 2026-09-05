import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CountdownTimer } from "@/components/ui/CountdownTimer";

// Reusing the ornamental motifs from our Epic design language
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

  return (
    <main className="min-h-screen text-parchment font-serif selection:bg-gold selection:text-ink flex flex-col items-center">
      
      {/* 1. Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center p-6 md:p-24 overflow-hidden border-b border-parchment/10 text-center">
        {/* Deep Sea Gradient & Distant Horizon */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent z-10" />
        
        {/* Colossal Faded Map Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none transform scale-125 md:rotate-12 origin-top-right mix-blend-screen"
             style={{ backgroundImage: 'radial-gradient(circle at center, #2E7D8C 1px, transparent 1px)', backgroundSize: '120px 120px' }}>
             <CompassRose className="absolute top-1/4 right-1/4 w-[400px] h-[400px] md:w-[800px] md:h-[800px] text-parchment animate-pulse" />
        </div>

        {/* Cinematic Title Alignment */}
        <div className="relative z-20 max-w-4xl space-y-8 md:space-y-12">
          <h1 className="font-serif text-7xl md:text-[10rem] font-normal tracking-tight leading-[0.8] text-parchment drop-shadow-2xl">
            NOSTOS
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-3xl text-parchment/80 leading-relaxed font-serif italic drop-shadow-lg">
            Sail home. Solve your way across ten trials. Live leaderboard. All online.
          </p>
          
          <div className="pt-8">
            <Link href="/register" passHref>
              <Button className="w-full sm:w-auto text-xl md:text-2xl px-12 py-4">Register Your Crew</Button>
            </Link>
          </div>
        </div>

        {/* 4. Live Countdown Timer */}
        <div className="relative z-20 mt-24 w-full max-w-3xl">
          <p className="text-gold tracking-[0.3em] uppercase text-sm font-bold mb-8 drop-shadow-md">The Odyssey Begins In</p>
          <CountdownTimer targetDate={targetDate} />
        </div>
      </section>

      <div className="w-full max-w-7xl px-4 md:px-12 mt-16 mb-16">
        <GreekKeyDivider />
      </div>

      {/* 2. How it works */}
      <section className="w-full max-w-5xl px-6 md:px-12 py-16">
        <h2 className="text-4xl md:text-6xl text-gold mb-16 text-center tracking-wide">The Voyage (How it Works)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          <div className="space-y-6">
            <span className="text-6xl font-bold text-gold/30">I.</span>
            <h3 className="text-2xl md:text-3xl text-parchment font-bold">Register Your Crew</h3>
            <p className="text-lg md:text-xl text-parchment/70 leading-relaxed">
              Gather your bravest sailors. You will need a unified crew to face the trials ahead. Name your ship and secure your passage before the winds change.
            </p>
          </div>

          <div className="space-y-6">
            <span className="text-6xl font-bold text-gold/30">II.</span>
            <h3 className="text-2xl md:text-3xl text-parchment font-bold">Log In Together</h3>
            <p className="text-lg md:text-xl text-parchment/70 leading-relaxed">
              When the time comes, assemble your crew online. You will navigate the treacherous waters together in real-time, sharing discoveries across your devices.
            </p>
          </div>

          <div className="space-y-6">
            <span className="text-6xl font-bold text-gold/30">III.</span>
            <h3 className="text-2xl md:text-3xl text-parchment font-bold">Solve Ten Trials</h3>
            <p className="text-lg md:text-xl text-parchment/70 leading-relaxed">
              Navigate through three harrowing rounds, facing sirens, cyclopes, and the wrath of the gods. Only wit and cooperation will unlock the path home.
            </p>
          </div>

          <div className="space-y-6">
            <span className="text-6xl font-bold text-gold/30">IV.</span>
            <h3 className="text-2xl md:text-3xl text-parchment font-bold">Ascend the Leaderboard</h3>
            <p className="text-lg md:text-xl text-parchment/70 leading-relaxed">
              Watch your ship climb the live ranks as you solve puzzles. Will you be the first to reach the shores of Ithaca?
            </p>
          </div>
        </div>
      </section>

      {/* 3. Rules Summary */}
      <section className="w-full max-w-4xl px-6 md:px-12 py-32 relative">
        <div className="absolute left-0 md:-left-8 top-16 h-[80%] w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent hidden md:block" />
        
        <h2 className="text-4xl md:text-6xl text-gold mb-16 tracking-wide">The Edicts (Rules)</h2>
        
        <div className="space-y-8 text-xl md:text-2xl text-parchment/80 leading-relaxed">
          <Card className="bg-transparent border-none">
            <CardContent className="p-0 space-y-8">
              <p>
                <span className="float-left text-6xl md:text-8xl font-bold text-gold mr-6 mt-2 leading-none">1.</span>
                <strong>Team Composition:</strong> A worthy vessel requires a crew of 3 to 4 members. No more, no less.
              </p>
              
              <p>
                <span className="float-left text-6xl md:text-8xl font-bold text-gold mr-6 mt-2 leading-none">2.</span>
                <strong>Format:</strong> The entire odyssey is fully online. You may communicate through any means you wish, but the trials will unfold directly on your devices.
              </p>
              
              <p>
                <span className="float-left text-6xl md:text-8xl font-bold text-gold mr-6 mt-2 leading-none">3.</span>
                <strong>The Victor:</strong> Glory is awarded based on levels cleared. Ties are broken by the fastest overall time, and finally, by the fewest incorrect attempts. Choose your answers wisely.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full border-t border-parchment/20 bg-ink mt-auto py-12 px-6">
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
