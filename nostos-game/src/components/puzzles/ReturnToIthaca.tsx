"use client";

import React, { useState, useEffect, useRef } from "react";
import { Target, RotateCcw } from "lucide-react";

interface ReturnToIthacaProps {
  data: {
    combination_clue: string;
  };
}

export function ReturnToIthaca({ data }: ReturnToIthacaProps) {
  const [minigameSolved, setMinigameSolved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [indicatorPos, setIndicatorPos] = useState(0); // 0 to 100 percentage
  const [hasFailed, setHasFailed] = useState(false);
  
  // Real answer input sync
  const [finalAnswer, setFinalAnswer] = useState("");
  useEffect(() => {
    const input = document.getElementById('oracle-form')?.querySelector('input[name="answer"]') as HTMLInputElement;
    if (input && minigameSolved) {
      input.value = finalAnswer;
    }
  }, [finalAnswer, minigameSolved]);

  const requestRef = useRef<number | undefined>(undefined);
  const directionRef = useRef<number>(1);
  const posRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Constants for tuning
  const SPEED = 0.08; // pixels (percentage) per ms
  const TARGET_START = 45; // percentage
  const TARGET_END = 55; // percentage

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      
      posRef.current += directionRef.current * SPEED * deltaTime;
      
      if (posRef.current >= 100) {
        posRef.current = 100;
        directionRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        directionRef.current = 1;
      }
      
      setIndicatorPos(posRef.current);
    }
    
    lastTimeRef.current = time;
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const handleStart = () => {
    setHasFailed(false);
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    const current = posRef.current;
    if (current >= TARGET_START && current <= TARGET_END) {
      setMinigameSolved(true);
    } else {
      setHasFailed(true);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8">
      
      {!minigameSolved ? (
        <div className="w-full max-w-2xl bg-ink/50 border-2 border-gold/40 p-8 rounded-xl shadow-2xl backdrop-blur-sm flex flex-col items-center">
          <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-4 mb-6 w-full flex items-center justify-center space-x-3">
            <Target className="w-6 h-6" />
            <span>Align the Stars</span>
          </h4>
          
          <p className="text-parchment/80 font-serif text-center italic text-lg mb-8 max-w-lg">
            "The final passage to Ithaca requires perfect alignment. Stop the star when it crosses the zenith."
          </p>

          {/* Timing Bar UI */}
          <div className="w-full h-16 bg-black border border-gold/30 rounded-full relative overflow-hidden mb-8 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
            {/* Target Zone */}
            <div 
              className={`absolute top-0 bottom-0 bg-gold/30 border-x-2 border-gold/80 transition-colors ${hasFailed ? 'bg-danger/30 border-danger/80' : ''}`}
              style={{ left: `${TARGET_START}%`, right: `${100 - TARGET_END}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(201,162,75,0.2)_50%,transparent_75%)] bg-[length:10px_10px]" />
            </div>

            {/* Indicator */}
            <div 
              className={`absolute top-1 bottom-1 w-4 -ml-2 rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] transition-colors ${hasFailed ? 'bg-danger' : 'bg-white'}`}
              style={{ left: `${indicatorPos}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex space-x-4">
            {!isPlaying && !hasFailed && (
              <button 
                onClick={handleStart}
                className="px-8 py-3 bg-gold/20 hover:bg-gold/30 border border-gold rounded uppercase tracking-widest text-gold text-lg shadow-[0_0_15px_rgba(201,162,75,0.4)] hover:shadow-[0_0_25px_rgba(201,162,75,0.8)] transition-all"
              >
                Begin Alignment
              </button>
            )}
            
            {isPlaying && (
              <button 
                onClick={handleStop}
                className="px-12 py-3 bg-white hover:bg-gray-200 border-2 border-gold rounded uppercase tracking-widest text-black text-xl font-bold shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all animate-pulse"
              >
                STOP
              </button>
            )}

            {hasFailed && !isPlaying && (
              <div className="flex flex-col items-center space-y-4">
                <span className="text-danger font-serif tracking-widest uppercase animate-pulse">Misaligned</span>
                <button 
                  onClick={handleStart}
                  className="flex items-center space-x-2 px-6 py-2 border border-danger/50 rounded text-danger hover:bg-danger/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-ink/50 border border-gold/40 p-8 rounded-xl shadow-2xl flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center space-x-3 text-gold/80 mb-6 border-b border-gold/20 pb-4 w-full justify-center">
            <Target className="w-6 h-6" />
            <h4 className="font-serif text-xl tracking-widest uppercase">Stars Aligned</h4>
          </div>
          
          <p className="text-parchment/90 font-serif text-center italic text-xl leading-relaxed mb-8 max-w-lg">
            "{data.combination_clue}"
          </p>

          <div className="w-full flex flex-col items-center">
            <input 
              type="text" 
              value={finalAnswer}
              onChange={e => setFinalAnswer(e.target.value)}
              placeholder="Enter final combination..."
              className="w-full max-w-md bg-ink/80 border border-gold/50 focus:border-gold px-4 py-3 rounded text-parchment outline-none font-serif text-center text-xl uppercase tracking-widest shadow-[0_0_15px_rgba(201,162,75,0.2)] focus:shadow-[0_0_25px_rgba(201,162,75,0.5)] transition-all"
            />
          </div>
        </div>
      )}

    </div>
  );
}
