"use client";

import React, { useState, useEffect } from "react";
import { getVariant } from "@/app/actions/getVariant";
import { useTeamSync } from "@/components/game/TeamSyncProvider";
import { Loader2, Scroll, Check } from "lucide-react";

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
  const [broadcasted, setBroadcasted] = useState(false);

  const { broadcastChatMessage, deviceAlias } = useTeamSync();
  
  // Local state for the mini-puzzles
  const [riddleInput, setRiddleInput] = useState("");
  const [patternClicks, setPatternClicks] = useState<number[]>([]);
  
  useEffect(() => {
    let isMounted = true;

    async function initVariant() {
      // 1. Get or create a device token in localStorage
      let token = localStorage.getItem("nostos_device_token");
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem("nostos_device_token", token);
      }

      const variantsList = data.variants && data.variants.length > 0 ? data.variants : ["THE", "ROAD", "HOME"];

      // 2. Check cached variant in localStorage for instant 0ms load
      const cached = localStorage.getItem(`nostos_variant_${levelId}`);
      if (cached && variantsList.includes(cached)) {
        if (isMounted) {
          setVariant(cached);
          setLoading(false);
        }
        return;
      }

      // 3. Instant deterministic fallback based on token hash (< 5ms load time)
      let hash = 0;
      for (let i = 0; i < token.length; i++) hash = (hash << 5) - hash + token.charCodeAt(i);
      const instantFallback = variantsList[Math.abs(hash) % variantsList.length];

      if (isMounted) {
        setVariant(instantFallback);
        setLoading(false);
      }

      // 4. Background fetch server assignment if available
      try {
        const result = await Promise.race([
          getVariant(levelId, token, variantsList),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 2500))
        ]);

        if (result && result.variant_key && isMounted) {
          setVariant(result.variant_key);
          localStorage.setItem(`nostos_variant_${levelId}`, result.variant_key);
        }
      } catch {
        // Silently use instant fallback
      }
    }

    initVariant();

    return () => {
      isMounted = false;
    };
  }, [levelId, data.variants]);

  const broadcastFragment = () => {
    if (!variant) return;

    const sender = deviceAlias || "Sailor";
    broadcastChatMessage(
      `Unlocked Underworld Fragment: "${variant}" (Coordinates: Lat 38°N, Long 23°E)`,
      sender
    );

    setBroadcasted(true);
    setTimeout(() => setBroadcasted(false), 4000);
  };

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

  // Riddle / Cipher Puzzle Validator
  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = riddleInput.trim().toUpperCase();
    if (variant === "THE" && (val === "NAME" || val === "MY NAME" || val === "A NAME")) {
      setSolved(true);
    } else if (variant === "ROAD" && (val === "26" || val === "TWENTY SIX" || val === "TWENTYSIX")) {
      setSolved(true);
    } else if (variant === "HOME" && (val === "HOME" || val === "THE ROAD HOME")) {
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
          
          {/* VARIANT 1: THE (Gate Latitude Riddle) */}
          {variant === "THE" && (
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-2 w-full">Shade of Gate Latitude</h4>
              <p className="text-parchment/80 font-serif text-center italic text-base">
                "What belongs to you, but everyone else uses it more than you do?"
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
                  Unlock Lat 38°N
                </button>
              </form>
            </div>
          )}

          {/* VARIANT 2: ROAD (Gate Longitude Sequence) */}
          {variant === "ROAD" && (
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-2 w-full">Shade of Gate Longitude</h4>
              <p className="text-parchment/80 font-serif text-center italic text-base">
                Solve the Underworld sequence pattern to unlock Longitude 23°E: <br />
                <span className="text-gold font-mono font-bold text-lg">2, 5, 10, 17, ?</span>
              </p>
              <form onSubmit={handleRiddleSubmit} className="w-full flex space-x-2">
                <input 
                  type="text" 
                  value={riddleInput}
                  onChange={e => setRiddleInput(e.target.value)}
                  placeholder="Missing number..."
                  className="flex-1 bg-ink/80 border border-gold/30 focus:border-gold/80 px-4 py-2 rounded text-parchment outline-none font-serif uppercase tracking-widest"
                />
                <button type="submit" className="px-6 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest">
                  Unlock Long 23°E
                </button>
              </form>
            </div>
          )}

          {/* VARIANT 3: HOME (Spectral Gate Cipher Key) */}
          {variant === "HOME" && (
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-2 w-full">Shade of the Key</h4>
              <p className="text-parchment/80 font-serif text-center italic text-base">
                "Decode the Underworld cipher: <span className="text-gold font-mono font-bold tracking-widest">I - P - N - F</span>"
              </p>
              <form onSubmit={handleRiddleSubmit} className="w-full flex space-x-2">
                <input 
                  type="text" 
                  value={riddleInput}
                  onChange={e => setRiddleInput(e.target.value)}
                  placeholder="Cipher word..."
                  className="flex-1 bg-ink/80 border border-gold/30 focus:border-gold/80 px-4 py-2 rounded text-parchment outline-none font-serif uppercase tracking-widest"
                />
                <button type="submit" className="px-6 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest">
                  Speak Passcode
                </button>
              </form>
            </div>
          )}
          
        </div>
      ) : (
        <div className="w-full max-w-lg bg-ink/80 border-2 border-gold p-8 rounded-xl shadow-[0_0_30px_rgba(201,162,75,0.15)] flex flex-col items-center animate-in zoom-in duration-500">
          <p className="text-parchment/80 font-serif italic mb-4">The shade whispers a fragment of truth:</p>
          <div className="text-4xl md:text-6xl font-serif text-gold font-bold tracking-widest drop-shadow-[0_0_15px_rgba(201,162,75,0.8)]">
            {variant}
          </div>
          
          <button
            onClick={broadcastFragment}
            className="mt-6 px-5 py-2.5 bg-gold/20 hover:bg-gold/30 border border-gold rounded-lg text-gold font-serif text-xs uppercase tracking-widest flex items-center space-x-2 transition-all shadow-md active:scale-95"
          >
            {broadcasted ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Transmitted to Crew Chat!</span>
              </>
            ) : (
              <>
                <Scroll className="w-4 h-4 text-gold" />
                <span>Transmit "{variant}" to Crew Chat</span>
              </>
            )}
          </button>

          <p className="mt-6 text-parchment/60 text-sm font-serif text-center">
            Share this fragment with your crew. Combine all unlocked Underworld fragments from your team members and speak the full truth to the Oracle below.
          </p>
        </div>
      )}

    </div>
  );
}
