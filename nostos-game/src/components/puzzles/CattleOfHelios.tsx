"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface CattleOfHeliosProps {
  data: {
    setup_q: string;
    main_q: string;
  };
  incorrectCount: number;
}

export function CattleOfHelios({ data, incorrectCount }: CattleOfHeliosProps) {
  const [setup1, setSetup1] = useState("");
  const [setup2, setSetup2] = useState("");
  const [setupSolved, setSetupSolved] = useState(false);
  
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyTime, setPenaltyTime] = useState(0);

  // Sync the standard form input for the real answer
  const [realAnswer, setRealAnswer] = useState("");
  useEffect(() => {
    const input = document.getElementById('oracle-form')?.querySelector('input[name="answer"]') as HTMLInputElement;
    if (input) {
      input.value = realAnswer;
    }
  }, [realAnswer]);

  const handleSetupCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (setup1.trim() === "10" && setup2.trim() === "10") {
      setSetupSolved(true);
    }
  };

  const handleDecoyClick = () => {
    if (penaltyActive) return;
    setPenaltyActive(true);
    setPenaltyTime(12); // 12 seconds penalty
    
    // Ghost submission to increment global incorrect counter
    const oracleForm = document.getElementById('oracle-form') as HTMLFormElement;
    if (oracleForm) {
      const oracleInput = oracleForm.querySelector('input[name="answer"]') as HTMLInputElement;
      if (oracleInput) {
        oracleInput.value = "DECOY_TRIGGERED";
        document.getElementById('oracle-submit-btn')?.click();
        // Clear it back
        setTimeout(() => { oracleInput.value = realAnswer; }, 100);
      }
    }
  };

  useEffect(() => {
    if (penaltyTime > 0) {
      const timer = setInterval(() => {
        setPenaltyTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (penaltyTime === 0 && penaltyActive) {
      setPenaltyActive(false);
    }
  }, [penaltyTime, penaltyActive]);

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8 relative">
      
      {!setupSolved ? (
        <div className="w-full max-w-lg bg-ink/50 border border-gold/20 p-8 rounded-xl shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-500">
          <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-4 mb-6">
            The Golden Logic
          </h4>
          <form onSubmit={handleSetupCheck} className="space-y-6 flex flex-col items-center">
            <p className="text-parchment/80 font-serif text-center italic text-lg leading-relaxed">
              "{data.setup_q}"
            </p>
            <div className="flex space-x-4 w-full">
              <div className="flex-1 space-y-2">
                <label className="text-xs uppercase tracking-widest text-parchment/50">First Number</label>
                <input 
                  type="text" 
                  value={setup1}
                  onChange={e => setSetup1(e.target.value)}
                  className="w-full bg-ink/80 border border-gold/30 focus:border-gold/80 px-4 py-3 rounded text-parchment outline-none font-serif text-center text-xl"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs uppercase tracking-widest text-parchment/50">Second Number</label>
                <input 
                  type="text" 
                  value={setup2}
                  onChange={e => setSetup2(e.target.value)}
                  className="w-full bg-ink/80 border border-gold/30 focus:border-gold/80 px-4 py-3 rounded text-parchment outline-none font-serif text-center text-xl"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="px-8 py-3 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest w-full mt-4 transition-colors"
            >
              Verify
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-ink/50 border-2 border-gold/40 p-8 rounded-xl shadow-[0_0_30px_rgba(201,162,75,0.15)] flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
          <h4 className="text-gold font-serif text-2xl tracking-widest uppercase text-center border-b border-gold/20 pb-4 mb-6 w-full">
            The Final Calculation
          </h4>
          
          <p className="text-parchment/90 font-serif text-center italic text-xl leading-relaxed mb-8">
            "{data.main_q}"
          </p>

          {/* The Trap */}
          <div className="w-full flex flex-col items-center space-y-12 mt-4 relative">
            
            {/* Giant Tempting Decoy Button */}
            <button
              type="button"
              onClick={handleDecoyClick}
              disabled={penaltyActive}
              className={`relative group px-12 py-6 rounded-2xl border-4 transition-all duration-300 w-full max-w-md ${
                penaltyActive 
                  ? 'border-zinc-700 bg-zinc-900 cursor-not-allowed opacity-50' 
                  : 'border-gold bg-gold/20 hover:bg-gold/30 hover:scale-105 cursor-pointer shadow-[0_0_50px_rgba(201,162,75,0.6)] hover:shadow-[0_0_80px_rgba(201,162,75,1)] animate-pulse'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className={`font-serif text-3xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(201,162,75,1)] ${penaltyActive ? 'text-zinc-500' : 'text-gold'}`}>
                SUBMIT ANSWER: 0
              </span>
              {!penaltyActive && (
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gold animate-ping opacity-75" />
              )}
            </button>

            {/* Subtle Real Input */}
            <div className="flex flex-col items-center w-32 opacity-50 hover:opacity-100 transition-opacity">
              <label className="text-xs uppercase tracking-widest text-parchment/30 mb-2">Or type manually</label>
              <input 
                type="text" 
                value={realAnswer}
                onChange={e => setRealAnswer(e.target.value)}
                disabled={penaltyActive}
                className="w-full bg-transparent border-b border-gold/30 focus:border-gold/80 px-2 py-1 text-parchment outline-none font-serif text-center"
              />
            </div>
            
          </div>
        </div>
      )}

      {/* Full Screen Penalty Overlay */}
      {penaltyActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-danger/95 backdrop-blur-md animate-in fade-in duration-300">
          <AlertTriangle className="w-32 h-32 text-black mb-8 animate-bounce" />
          <h1 className="text-6xl md:text-8xl font-serif text-black font-bold tracking-widest uppercase mb-4 text-center">
            Helios Sees You
          </h1>
          <p className="text-2xl text-black/80 font-serif italic max-w-2xl text-center mb-12">
            You tried to take the sacred cattle. The Sun God demands a moment of absolute stillness for your hubris.
          </p>
          <div className="text-8xl font-mono text-black font-bold animate-pulse">
            {penaltyTime}
          </div>
        </div>
      )}

    </div>
  );
}
