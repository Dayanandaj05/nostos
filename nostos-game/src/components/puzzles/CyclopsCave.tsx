"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, Unlock } from "lucide-react";

interface CyclopsCaveProps {
  data: {
    riddles: { q: string, a: string }[];
  };
  incorrectCount: number;
}

export function CyclopsCave({ data, incorrectCount }: CyclopsCaveProps) {
  const [step, setStep] = useState(0); // 0: riddle 1, 1: riddle 2, 2: riddle 3 (main input)
  const [localInput, setLocalInput] = useState("");
  const [error, setError] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const parentForm = document.getElementById('oracle-form') as HTMLFormElement;
    if (parentForm) {
      formRef.current = parentForm;
      
      const handleSubmit = (e: SubmitEvent) => {
        if (step === 2 && !doorOpen) {
          const input = parentForm.querySelector('input[name="answer"]') as HTMLInputElement;
          if (input && input.value.trim().toUpperCase() === "NOBODY") {
            e.preventDefault(); // Pause the submission
            setDoorOpen(true);
            
            // Wait for animation, then submit for real
            setTimeout(() => {
              parentForm.removeEventListener('submit', handleSubmit);
              parentForm.requestSubmit();
            }, 1500);
          }
        }
      };

      parentForm.addEventListener('submit', handleSubmit);
      return () => parentForm.removeEventListener('submit', handleSubmit);
    }
  }, [step, doorOpen]);

  // Handle local riddles (0 and 1)
  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step >= data.riddles.length) return;

    const currentCorrect = data.riddles[step].a;
    if (localInput.trim().toUpperCase() === currentCorrect) {
      setStep(s => s + 1);
      setLocalInput("");
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
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
      <div className="w-full max-w-lg min-h-[120px] flex flex-col items-center justify-center">
        {step < 2 ? (
          <form onSubmit={handleLocalSubmit} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-parchment/90 font-serif text-center md:text-lg italic leading-relaxed">
              "{data.riddles[step].q}"
            </p>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                placeholder="Speak..."
                className={`flex-1 bg-ink/50 border ${error ? 'border-danger/80 animate-shake' : 'border-gold/30 focus:border-gold/80'} px-4 py-2 rounded text-parchment outline-none font-serif uppercase tracking-widest`}
              />
              <button 
                type="submit"
                className="px-6 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest transition-colors"
              >
                Unlock
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in duration-700">
            <p className="text-gold font-serif text-center md:text-xl tracking-widest">
              The final lock awaits the true name.
            </p>
            <p className="text-parchment/60 font-serif italic text-center">
              Speak it to the Oracle below to break the seal.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
