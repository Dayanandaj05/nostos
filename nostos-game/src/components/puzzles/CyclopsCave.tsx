"use client";

import React, { useState } from "react";
import { Lock, Unlock, Key } from "lucide-react";

interface CyclopsCaveProps {
  data: {
    riddles?: { q: string, a: string }[];
  };
  incorrectCount: number;
}

const DEFAULT_RIDDLES = [
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "ECHO" },
  { q: "The more of this there is, the less you see. What is it?", a: "DARKNESS" },
  { q: "What has keys but can't open locks?", a: "PIANO" }
];

export function CyclopsCave({ data, incorrectCount }: CyclopsCaveProps) {
  const [step, setStep] = useState(0); // 0: Lock 1, 1: Lock 2, 2: Lock 3, 3: All Unlocked
  const [localInput, setLocalInput] = useState("");
  const [error, setError] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);

  const riddles = data?.riddles && data.riddles.length >= 3 ? data.riddles : DEFAULT_RIDDLES;

  const clean = (str: string) => str.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const triggerOracleSubmit = () => {
    setDoorOpen(true);
    setTimeout(() => {
      const parentForm = document.getElementById('oracle-form') as HTMLFormElement;
      if (parentForm) {
        const input = parentForm.querySelector('input[name="answer"]') as HTMLInputElement;
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          const finalAnswer = riddles[0]?.a || "ECHO";
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, finalAnswer);
          } else {
            input.value = finalAnswer;
          }
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        const submitBtn = document.getElementById('oracle-submit-btn');
        if (submitBtn) {
          submitBtn.click();
        }
      }
    }, 1400);
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step >= 3) return;

    const userEntered = clean(localInput);
    if (!userEntered) return;

    const correctAnswer = clean(riddles[step].a);
    let isMatch = userEntered.includes(correctAnswer) || userEntered === correctAnswer;
    
    // Add leniency for generic answers
    if (correctAnswer === "ECHO") {
      isMatch = isMatch || userEntered.includes("SOUND") || userEntered.includes("VOICE");
    } else if (correctAnswer === "DARKNESS") {
      isMatch = isMatch || userEntered.includes("DARK") || userEntered.includes("SHADOW");
    } else if (correctAnswer === "PIANO") {
      isMatch = isMatch || userEntered.includes("KEYBOARD") || userEntered.includes("ORGAN");
    }

    if (isMatch) {
      setError(false);
      setLocalInput("");
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep === 3) {
        triggerOracleSubmit();
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 1200);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full pb-8">
      
      {/* SVG Stone Door & Revealed Cave */}
      <div className="relative w-64 h-80 md:w-80 md:h-96 overflow-hidden border-4 border-gold/40 rounded-t-full shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-black">
        
        {/* Stone Door Graphic (Slides up when all 3 locks unlock) */}
        <div 
          className="absolute inset-0 bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black transition-transform duration-[1500ms] ease-in-out border-b-4 border-gold/30 flex flex-col items-center justify-center space-y-6 z-10"
          style={{ 
            transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          {/* Rock texture overlay */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#C9A24B_1px,transparent_1px)] [background-size:16px_16px]" />

          <span className="font-serif text-gold/70 uppercase tracking-widest text-xs font-bold">
            {step < 3 ? `Lock ${step + 1} of 3` : 'Seals Broken'}
          </span>

          {/* 3 Locks: One unlocks per answered question */}
          <div className="z-10 flex flex-col space-y-4">
            {[0, 1, 2].map(lockIndex => {
              const isUnlocked = step > lockIndex;
              return (
                <div 
                  key={lockIndex}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                    isUnlocked 
                      ? 'border-gold bg-gold/20 shadow-[0_0_20px_rgba(201,162,75,0.6)] scale-105' 
                      : 'border-zinc-600 bg-zinc-800/90 shadow-inner'
                  }`}
                >
                  <div className={`transition-transform duration-500 ${isUnlocked ? 'scale-110' : 'scale-100'}`}>
                    {isUnlocked 
                      ? <Unlock className="text-gold w-7 h-7" />
                      : <Lock className="text-zinc-500 w-7 h-7" />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Behind the door: Glowing Cave Interior revealed at last */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/90 via-gold/50 to-amber-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <span className="text-4xl animate-bounce">🌄</span>
          <p className="font-serif text-ink font-bold text-xl tracking-widest uppercase drop-shadow">
            Freedom Beyond!
          </p>
          <p className="font-serif text-ink/80 text-xs italic font-medium">
            The massive stone rolls away... revealing the open shore!
          </p>
        </div>

      </div>

      {/* Riddle UI */}
      <div className="w-full max-w-lg min-h-[150px] flex flex-col items-center justify-center space-y-4">
        {step < 3 ? (
          <form onSubmit={handleLocalSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-ink/80 border border-gold/30 p-4 rounded-lg text-center space-y-2">
              <span className="text-gold/60 font-serif uppercase tracking-widest text-xs font-bold">
                Lock {step + 1} Riddle
              </span>
              <p className="text-parchment/90 font-serif md:text-lg italic leading-relaxed">
                "{riddles[step]?.q}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                placeholder={`Answer Lock ${step + 1}...`}
                className={`flex-1 bg-ink/50 border ${error ? 'border-danger text-danger bg-danger/10 animate-shake' : 'border-gold/30 focus:border-gold/80'} px-4 py-2.5 rounded text-parchment outline-none font-serif uppercase tracking-widest text-sm`}
              />
              <button 
                type="submit"
                className="px-6 py-2.5 bg-gold/15 hover:bg-gold/30 border border-gold/50 rounded text-gold uppercase tracking-widest transition-colors font-serif font-bold flex items-center justify-center gap-2 text-sm shadow-[0_0_10px_rgba(201,162,75,0.2)]"
              >
                <Key className="w-4 h-4" />
                Unlock
              </button>
            </div>

            {error && (
              <p className="text-danger font-serif text-sm italic text-center animate-fade-in">
                The iron seal remains locked... your answer is incorrect.
              </p>
            )}
          </form>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in duration-700 text-center">
            <p className="text-gold font-serif text-2xl tracking-widest uppercase animate-pulse">
              All 3 Locks Shattered!
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

