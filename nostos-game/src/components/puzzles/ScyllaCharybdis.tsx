"use client";

import React, { useState, useEffect } from "react";
import { getCommittedPath, commitToPath } from "@/app/actions/teamPath";
import { Loader2 } from "lucide-react";

interface ScyllaCharybdisProps {
  levelId: string;
  data: {
    paths: {
      A: { q: string, a: string },
      B: { q: string, a: string }
    }
  };
  incorrectCount: number;
}

export function ScyllaCharybdis({ levelId, data, incorrectCount }: ScyllaCharybdisProps) {
  const [committedPath, setCommittedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localInput, setLocalInput] = useState("");
  const [localError, setLocalError] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    async function init() {
      const { path } = await getCommittedPath(levelId);
      if (path) setCommittedPath(path);
      setLoading(false);
    }
    init();
  }, [levelId]);

  const handlePathClick = (pathKey: string) => {
    if (committedPath || isCommitting) return;
    // Instant optimistic local UI update (0ms delay)
    setCommittedPath(pathKey);
    setIsCommitting(true);
    
    // Background sync to server DB
    commitToPath(levelId, pathKey).then(result => {
      if (result?.path) setCommittedPath(result.path);
      setIsCommitting(false);
    }).catch(() => {
      setIsCommitting(false);
    });
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!committedPath) return;

    const currentPuzzle = data.paths[committedPath as 'A' | 'B'];
    if (localInput.trim().toUpperCase() === currentPuzzle.a.toUpperCase()) {
      // Correct! Submit to Oracle
      const oracleForm = document.getElementById('oracle-form') as HTMLFormElement;
      if (oracleForm) {
        const oracleInput = oracleForm.querySelector('input[name="answer"]') as HTMLInputElement;
        if (oracleInput) {
          oracleInput.value = "DEPENDS_ON_PATH";
          document.getElementById('oracle-submit-btn')?.click();
        }
      }
    } else {
      // Incorrect
      setLocalError(true);
      setTimeout(() => setLocalError(false), 800);
      
      // Also silently submit a dummy wrong answer to the Oracle to increment the global "gods laugh" counter
      const oracleForm = document.getElementById('oracle-form') as HTMLFormElement;
      if (oracleForm) {
        const oracleInput = oracleForm.querySelector('input[name="answer"]') as HTMLInputElement;
        if (oracleInput) {
          oracleInput.value = "WRONG_PATH_ANSWER";
          document.getElementById('oracle-submit-btn')?.click();
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const pathA_active = committedPath === 'A';
  const pathB_active = committedPath === 'B';
  const pathA_locked = committedPath === 'B';
  const pathB_locked = committedPath === 'A';

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8">
      
      {/* Visual Crossroads */}
      <div className="relative w-full max-w-3xl aspect-[16/7] bg-[#020617] border-2 border-gold/30 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
        
        <h4 className="absolute top-4 text-parchment/60 font-serif tracking-widest uppercase text-sm md:text-base z-20">
          {committedPath ? "The Path is Chosen" : "Choose Your Doom"}
        </h4>

        {/* SVG Graphic */}
        <svg viewBox="0 0 800 350" className="w-full h-full absolute inset-0 z-10" preserveAspectRatio="xMidYMid slice">
          
          <defs>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            
            <radialGradient id="scyllaGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="charybdisGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Water */}
          <rect width="800" height="350" fill="url(#waterGrad)" opacity="0.3" />

          {/* Path A (Left) - Scylla */}
          <g 
            onClick={() => handlePathClick('A')}
            className={`transition-all duration-700 ${!committedPath ? 'cursor-pointer hover:opacity-100' : ''} ${pathA_active ? 'opacity-100 scale-100' : 'opacity-30 scale-95 saturate-0'} ${pathA_locked ? 'pointer-events-none' : ''}`}
            style={{ transformOrigin: '25% 50%' }}
          >
            {/* Clickable Area */}
            <path d="M400,350 Q300,200 100,0 L0,0 L0,350 Z" fill="transparent" />
            
            {/* The Path Water */}
            <path d="M380,350 Q280,200 120,0 L220,0 Q330,180 420,350 Z" fill="#0ea5e9" opacity={pathA_active ? 0.4 : 0.1} />
            
            <circle cx="150" cy="150" r="100" fill="url(#scyllaGlow)" />
            {/* Scylla Rocks/Heads (Abstract) */}
            <path d="M50,150 Q100,50 150,120 T220,80 T250,150 Z" fill="#450a0a" />
            <path d="M80,100 Q120,40 130,80" stroke="#f87171" strokeWidth="4" fill="none" />
            <path d="M150,100 Q180,30 200,90" stroke="#f87171" strokeWidth="4" fill="none" />
            <path d="M190,120 Q240,60 230,110" stroke="#f87171" strokeWidth="4" fill="none" />
            
            <text x="150" y="220" textAnchor="middle" fill="#f87171" fontSize="24" fontFamily="serif" fontWeight="bold" letterSpacing="4">
              SCYLLA
            </text>
          </g>

          {/* Path B (Right) - Charybdis */}
          <g 
            onClick={() => handlePathClick('B')}
            className={`transition-all duration-700 ${!committedPath ? 'cursor-pointer hover:opacity-100' : ''} ${pathB_active ? 'opacity-100 scale-100' : 'opacity-30 scale-95 saturate-0'} ${pathB_locked ? 'pointer-events-none' : ''}`}
            style={{ transformOrigin: '75% 50%' }}
          >
            {/* Clickable Area */}
            <path d="M400,350 Q500,200 700,0 L800,0 L800,350 Z" fill="transparent" />
            
            {/* The Path Water */}
            <path d="M380,350 Q470,180 580,0 L680,0 Q520,200 420,350 Z" fill="#0ea5e9" opacity={pathB_active ? 0.4 : 0.1} />
            
            <circle cx="650" cy="150" r="100" fill="url(#charybdisGlow)" />
            {/* Charybdis Whirlpool */}
            <path d="M570,150 A80,40 0 1,1 730,150 A80,40 0 1,1 570,150" stroke="#38bdf8" strokeWidth="4" fill="none" opacity="0.8" />
            <path d="M590,150 A60,30 0 1,1 710,150 A60,30 0 1,1 590,150" stroke="#0ea5e9" strokeWidth="6" fill="none" opacity="0.6" />
            <path d="M620,150 A30,15 0 1,1 680,150 A30,15 0 1,1 620,150" stroke="#0284c7" strokeWidth="8" fill="none" opacity="0.4" />
            
            <text x="650" y="240" textAnchor="middle" fill="#38bdf8" fontSize="24" fontFamily="serif" fontWeight="bold" letterSpacing="4">
              CHARYBDIS
            </text>
          </g>

          {/* The Ship (Bottom Center) */}
          <g transform={`translate(${!committedPath ? 400 : pathA_active ? 300 : 500}, 300) scale(${!committedPath ? 1 : 0.7})`} className="transition-all duration-[1500ms] ease-in-out">
            <path d="M-20,-10 L20,-10 L15,10 L-15,10 Z" fill="#c9a24b" />
            <rect x="-2" y="-30" width="4" height="20" fill="#78350f" />
            <path d="M0,-30 L20,-15 L0,-10 Z" fill="#fef3c7" opacity="0.8" />
          </g>
          
        </svg>

      </div>

      {/* Local Puzzle */}
      {committedPath && (
        <div className="w-full max-w-lg bg-ink/50 border-2 border-gold/40 p-8 rounded-xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-8 duration-700">
          <h4 className="text-gold font-serif text-xl tracking-widest uppercase text-center border-b border-gold/20 pb-4 mb-6">
            Trial of {committedPath === 'A' ? 'Scylla' : 'Charybdis'}
          </h4>
          <form onSubmit={handleLocalSubmit} className="space-y-6 flex flex-col items-center">
            <p className="text-parchment/90 font-serif text-center italic text-lg leading-relaxed">
              "{data.paths[committedPath as 'A' | 'B'].q}"
            </p>
            <div className="w-full flex space-x-2">
              <input 
                type="text" 
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                placeholder="Enter answer..."
                className={`flex-1 bg-ink/80 border ${localError ? 'border-danger/80 animate-shake' : 'border-gold/30 focus:border-gold/80'} px-4 py-3 rounded text-parchment outline-none font-serif tracking-widest text-center text-xl`}
              />
              <button 
                type="submit" 
                disabled={isCommitting}
                className="px-8 py-3 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold uppercase tracking-widest"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
