"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, Unlock, Key, Sparkles } from "lucide-react";

interface CyclopsCaveProps {
  data: {
    riddles: { q: string, a: string }[];
  };
  incorrectCount: number;
}

export function CyclopsCave({ data, incorrectCount }: CyclopsCaveProps) {
  const [step, setStep] = useState(0); // 0: riddle 1, 1: riddle 2, 2: completed riddles
  const [localInput, setLocalInput] = useState("");
  const [error, setError] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);

  const clean = (str: string) => str.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const triggerOracleSubmit = () => {
    setDoorOpen(true);
    setTimeout(() => {
      const parentForm = document.getElementById('oracle-form') as HTMLFormElement;
      if (parentForm) {
        const input = parentForm.querySelector('input[name="answer"]') as HTMLInputElement;
        if (input) {
          input.value = "NOBODY";
        }
        parentForm.requestSubmit();
      }
    }, 1200);
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step >= 2) return;

    const currentTarget = step === 0 ? "NOTHING" : "NOBODY";
    const userEntered = clean(localInput);

    if (!userEntered) return;

    if (userEntered === currentTarget || userEntered.includes(currentTarget)) {
      setError(false);
      setLocalInput("");
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep === 2) {
        triggerOracleSubmit();
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 1200);
    }
  };

  const handleAutoSolve = () => {
    setStep(2);
    setError(false);
    triggerOracleSubmit();
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full pb-8">
      
      {/* SVG Cave Door */}
      <div className="relative w-64 h-80 md:w-80 md:h-96 overflow-hidden border-4 border-gold/30 rounded-t-full shadow-2xl bg-black">
        {/* The Door Graphic */}
        <div 
          className="absolute inset-0 bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black transition-transform duration-[1500ms] ease-in-out border-b-4 border-gold/20 flex flex-col items-center justify-center space-y-8"
          style={{ 
            transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          {/* Rock texture overlay */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />

          {/* Locks */}
          <div className="z-10 flex flex-col space-y-6">
            {[0, 1, 2].map(lockIndex => {
              const isUnlocked = step > lockIndex || (lockIndex === 2 && doorOpen);
              return (
                <div 
                  key={lockIndex}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                    isUnlocked 
                      ? 'border-gold bg-gold/10 shadow-[0_0_15px_rgba(201,162,75,0.4)]' 
                      : 'border-zinc-500 bg-zinc-800/80 shadow-none'
                  }`}
                >
                  <div className={`transition-transform duration-500 ${isUnlocked ? 'scale-110' : 'scale-100'}`}>
                    {isUnlocked 
                      ? <Unlock className="text-gold w-8 h-8" />
                      : <Lock className="text-zinc-500 w-8 h-8" />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Behind the door (The exit glowing) */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-100 via-gold/40 to-black opacity-80" />
      </div>

      {/* Riddle UI */}
      <div className="w-full max-w-lg min-h-[140px] flex flex-col items-center justify-center space-y-4">
        {step < 2 ? (
          <form onSubmit={handleLocalSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-parchment/90 font-serif text-center md:text-lg italic leading-relaxed">
              {step === 0 
                ? `"What is greater than the gods, more evil than the demons, the poor have it, the rich need it, and if you eat it, you will die?"`
                : `"If you are NOTHING to him, what must you call yourself?"`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                placeholder="Speak..."
                className={`flex-1 bg-ink/50 border ${error ? 'border-danger text-danger bg-danger/10 animate-shake' : 'border-gold/30 focus:border-gold/80'} px-4 py-2 rounded text-parchment outline-none font-serif uppercase tracking-widest`}
              />
              <button 
                type="submit"
                className="px-6 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest transition-colors font-serif font-bold flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Unlock
              </button>
            </div>
            {error && (
              <p className="text-danger font-serif text-sm italic text-center animate-fade-in">
                The cave echoes with silence... your answer is incorrect.
              </p>
            )}
          </form>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in duration-700 text-center">
            <p className="text-gold font-serif text-2xl tracking-widest uppercase animate-pulse">
              The Cave Door Opens!
            </p>
            <p className="text-parchment/80 font-serif italic">
              Escaping Polyphemus's cave... advancing to Trial 4.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
