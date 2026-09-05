"use client";

import React, { useState, useEffect } from "react";
import { getVariant } from "@/app/actions/getVariant";
import { Loader2, Key } from "lucide-react";

interface LandOfTheDeadProps {
  levelId: string;
  data: {
    variants: string[];
  };
  incorrectCount: number;
}

export function LandOfTheDead({ levelId, data, incorrectCount }: LandOfTheDeadProps) {
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(false);
  
  // Local state for the mini-puzzles
  const [riddleInput, setRiddleInput] = useState("");
  const [patternClicks, setPatternClicks] = useState<number[]>([]);
  
  useEffect(() => {
    async function initVariant() {
      // 1. Get or create a device token in localStorage
      let token = localStorage.getItem("nostos_device_token");
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem("nostos_device_token", token);
      }

      // 2. Fetch assignment from server
      const result = await getVariant(levelId, token, data.variants);
      if (result.variant_key) {
        setVariant(result.variant_key);
      } else {
        console.error(result.error);
      }
      setLoading(false);
    }

    initVariant();
  }, [levelId, data.variants]);

  // Visual Pattern Puzzle (ROAD variant)
  const handlePatternClick = (index: number) => {
    const newClicks = [...patternClicks, index];
    setPatternClicks(newClicks);
    
    // Target pattern: 0, 3, 1, 2
    const target = [0, 3, 1, 2];
    if (newClicks.length === target.length) {
      if (newClicks.every((val, i) => val === target[i])) {
        setSolved(true);
      } else {
        // Reset if wrong
        setPatternClicks([]);
      }
    }
  };

  // Riddle Puzzle (THE variant)
  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (riddleInput.trim().toUpperCase() === "ECHO") {
      setSolved(true);
    } else {
      setRiddleInput("");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-gold">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="font-serif tracking-widest uppercase">Consulting the Shades...</p>
      </div>
    );
  }

  if (!variant) {
    return <div className="text-danger">Failed to connect to the Underworld. Please refresh.</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8">
      
      {!solved ? (
        <div className="w-full max-w-lg bg-ink/50 border border-gold/20 p-8 rounded-xl shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-500">
          
          {/* VARIANT 1: THE (Riddle) */}
          {variant === "THE" && (
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-2 w-full">The Shade of Memory</h4>
              <p className="text-parchment/80 font-serif text-center italic text-lg">
                "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?"
              </p>
              <form onSubmit={handleRiddleSubmit} className="w-full flex space-x-2">
                <input 
                  type="text" 
                  value={riddleInput}
                  onChange={e => setRiddleInput(e.target.value)}
                  placeholder="Your answer..."
                  className="flex-1 bg-ink/80 border border-gold/30 focus:border-gold/80 px-4 py-2 rounded text-parchment outline-none font-serif uppercase tracking-widest"
                />
                <button type="submit" className="px-6 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest">
                  Speak
                </button>
              </form>
            </div>
          )}

          {/* VARIANT 2: ROAD (Pattern) */}
          {variant === "ROAD" && (
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-2 w-full">The Shade of Paths</h4>
              <p className="text-parchment/80 font-serif text-center italic">
                The stones glow in a specific order: Top-Left, Bottom-Right, Top-Right, Bottom-Left.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[0, 1, 2, 3].map(i => (
                  <div 
                    key={i}
                    onClick={() => handlePatternClick(i)}
                    className={`w-20 h-20 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-300 ${patternClicks.includes(i) ? 'border-gold bg-gold/20' : 'border-zinc-700 bg-zinc-800/50 hover:border-gold/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full ${patternClicks.includes(i) ? 'bg-gold' : 'bg-zinc-600'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VARIANT 3: HOME (Map Fragment) */}
          {variant === "HOME" && (
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-2 w-full">The Shade of Longing</h4>
              <p className="text-parchment/80 font-serif text-center italic">
                The map is torn, but a word is visible. Click the eye to reveal it.
              </p>
              <div 
                className="w-full h-48 border border-gold/30 rounded-lg bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-zinc-800 flex items-center justify-center cursor-pointer hover:opacity-90"
                onClick={() => setSolved(true)}
              >
                <div className="w-16 h-16 rounded-full border-2 border-gold/50 flex items-center justify-center bg-ink/50 backdrop-blur-sm">
                  <Key className="w-8 h-8 text-gold" />
                </div>
              </div>
            </div>
          )}
          
        </div>
      ) : (
        <div className="w-full max-w-lg bg-ink/80 border-2 border-gold p-8 rounded-xl shadow-[0_0_30px_rgba(201,162,75,0.15)] flex flex-col items-center animate-in zoom-in duration-500">
          <p className="text-parchment/80 font-serif italic mb-4">The shade whispers a fragment of truth:</p>
          <div className="text-4xl md:text-6xl font-serif text-gold font-bold tracking-widest drop-shadow-[0_0_15px_rgba(201,162,75,0.8)]">
            {variant}
          </div>
          <p className="mt-8 text-parchment/60 text-sm font-serif text-center">
            Share this with your crew. Combine your knowledge and speak the full truth to the Oracle below.
          </p>
        </div>
      )}

    </div>
  );
}
