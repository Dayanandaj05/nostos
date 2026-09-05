"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSirensVariant } from "@/app/actions/getSirensVariant";
import { getTeamId } from "@/app/actions/getTeamId";
import { supabase } from "@/lib/supabase";
import { Loader2, Ear, AlertTriangle } from "lucide-react";

interface SirensSongProps {
  levelId: string;
}

const WAVES = [
  { wave: 1, gold: "TRUST", fakes: ["SAIL", "LISTEN", "STAY", "COME", "HEAR", "REST", "SLEEP", "JOIN", "SINK"] },
  { wave: 2, gold: "NO", fakes: ["YES", "THE", "A", "AND", "OR", "BUT", "IF", "SO", "FOR"] },
  { wave: 3, gold: "SONG", fakes: ["WIND", "SEA", "WAVE", "VOICE", "CALL", "CRY", "TEAR", "DEPTH", "DARK"] },
];

type Bubble = {
  id: string;
  word: string;
  isGold: boolean;
  left: number; // percentage
  delay: number; // seconds
  size: number; // scale
};

export function SirensSong({ levelId }: SirensSongProps) {
  const [variant, setVariant] = useState<string | null>(null);
  const [teamId, setLocalTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [playing, setPlaying] = useState(false);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  
  const [tray, setTray] = useState<string[]>([]);
  
  const channelRef = useRef<any>(null);

  // Init Variant and Realtime Channel
  useEffect(() => {
    async function init() {
      // 1. Local Device Token
      let token = localStorage.getItem("nostos_device_token");
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem("nostos_device_token", token);
      }

      // 2. Fetch Variant
      const vRes = await getSirensVariant(levelId, token);
      if (vRes.variant_key) setVariant(vRes.variant_key);

      // 3. Fetch Team ID & Setup Realtime
      const tid = await getTeamId();
      if (tid) {
        setLocalTeamId(tid);
        const channel = supabase.channel(`sirens_${tid}`, {
          config: { broadcast: { self: true } } // listen to our own broadcasts too just in case
        });
        
        channel.on('broadcast', { event: 'update_tray' }, (payload) => {
          setTray(payload.payload.tray);
        }).subscribe();
        
        channelRef.current = channel;
      }

      setLoading(false);
    }
    init();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [levelId]);

  // Sync tray to the main GameEngine form
  useEffect(() => {
    const input = document.getElementById('oracle-form')?.querySelector('input[name="answer"]') as HTMLInputElement;
    if (input && tray.length > 0) {
      input.value = tray.join(" ");
    }
  }, [tray]);

  const handlePlay = () => {
    if (lockedOut || playing) return;
    
    if (rewatchCount >= 3) {
      setLockedOut(true);
      setTimeout(() => {
        setLockedOut(false);
        setRewatchCount(0);
      }, 10000); // 10 second lockout
      return;
    }

    setPlaying(true);
    setRewatchCount(prev => prev + 1);

    // Generate bubbles for 3 waves
    const newBubbles: Bubble[] = [];
    WAVES.forEach((waveData, wIdx) => {
      const baseDelay = wIdx * 4; // Wave 1: 0s, Wave 2: 4s, Wave 3: 8s
      
      // Add fake words
      waveData.fakes.forEach((word, i) => {
        newBubbles.push({
          id: `w${wIdx}-f${i}`,
          word,
          isGold: false,
          left: Math.random() * 85,
          delay: baseDelay + Math.random() * 2,
          size: 0.8 + Math.random() * 0.5,
        });
      });
      
      // Add gold word
      newBubbles.push({
        id: `w${wIdx}-gold`,
        word: waveData.gold,
        isGold: true,
        left: 20 + Math.random() * 50,
        delay: baseDelay + 1 + Math.random() * 1.5,
        size: 1.1 + Math.random() * 0.4,
      });
    });
    
    setBubbles(newBubbles);

    // Stop playing after sequence completes (~12 seconds)
    setTimeout(() => {
      setPlaying(false);
      setBubbles([]);
    }, 13000);
  };

  const handleCapture = (word: string, isGold: boolean) => {
    if (variant === "blurred") return; // blurred cannot interact accurately
    
    // Allow clicking gold words if not already in tray
    if (isGold && !tray.includes(word)) {
      const newTray = [...tray, word];
      setTray(newTray);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'update_tray',
        payload: { tray: newTray }
      });
    }
  };

  const clearTray = () => {
    setTray([]);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'update_tray',
      payload: { tray: [] }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 w-full pb-8 select-none">
      
      {/* Top Status */}
      <div className="w-full max-w-3xl flex justify-between items-end px-2">
        <div className="flex flex-col">
          <span className="text-parchment/50 font-serif text-sm tracking-widest uppercase">Your Sense</span>
          <span className={`font-serif text-xl tracking-widest uppercase ${variant === 'blurred' ? 'text-zinc-500' : 'text-gold drop-shadow-[0_0_10px_rgba(201,162,75,0.8)]'}`}>
            {variant === 'blurred' ? 'Deafened' : 'Listening'}
          </span>
        </div>
        
        {lockedOut ? (
          <div className="text-danger flex items-center space-x-2 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-serif tracking-widest uppercase text-sm">The Sirens Shriek (Wait...)</span>
          </div>
        ) : (
          <button
            onClick={handlePlay}
            disabled={playing}
            className={`flex items-center space-x-2 px-6 py-2 border rounded transition-all ${
              playing ? 'border-zinc-700 text-zinc-600 cursor-not-allowed' : 'border-gold/50 text-gold hover:bg-gold/10'
            }`}
          >
            <Ear className="w-5 h-5" />
            <span className="font-serif tracking-widest uppercase text-sm">
              {playing ? 'Listening...' : `Listen (Plays: ${rewatchCount}/3)`}
            </span>
          </button>
        )}
      </div>

      {/* The Sea of Voices (Wall) */}
      <div className="relative w-full max-w-3xl h-[450px] bg-[#020617] border-2 border-gold/30 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

        <div className={`absolute inset-0 w-full h-full ${variant === 'blurred' ? 'blur-[10px] opacity-70 pointer-events-none' : ''}`}>
          {bubbles.map(b => (
            <div
              key={b.id}
              onClick={() => handleCapture(b.word, b.isGold)}
              className={`absolute bottom-[-100px] flex items-center justify-center rounded-full border transition-colors cursor-pointer hover:bg-white/10 ${
                b.isGold ? 'border-gold/80 bg-gold/5' : 'border-blue-400/30 bg-blue-500/5'
              }`}
              style={{
                left: `${b.left}%`,
                width: `${80 * b.size}px`,
                height: `${80 * b.size}px`,
                animation: `floatUp 5s linear forwards`,
                animationDelay: `${b.delay}s`,
              }}
            >
              <span className={`font-serif tracking-widest text-sm md:text-base ${
                b.isGold ? 'text-gold drop-shadow-[0_0_8px_rgba(201,162,75,1)] font-bold' : 'text-blue-200/50'
              }`}>
                {b.word}
              </span>
            </div>
          ))}
        </div>
        
        {!playing && !lockedOut && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-parchment/30 font-serif italic tracking-widest text-lg">
              The waters are silent.
            </p>
          </div>
        )}
      </div>

      {/* Shared Tray */}
      <div className="w-full max-w-3xl flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-parchment/50 font-serif tracking-widest text-sm uppercase">
          <span>Captured Melody</span>
          {tray.length > 0 && (
            <button onClick={clearTray} className="text-danger/70 hover:text-danger ml-4 underline text-xs">
              Clear
            </button>
          )}
        </div>
        
        <div className="flex space-x-4 min-h-[80px] w-full items-center justify-center border border-gold/10 bg-ink/30 rounded-lg p-4 backdrop-blur-sm">
          {tray.length === 0 && (
            <span className="text-parchment/30 font-serif italic text-sm">Empty...</span>
          )}
          {tray.map((word, idx) => (
            <div key={idx} className="px-6 py-3 border-2 border-gold bg-gold/10 rounded shadow-[0_0_15px_rgba(201,162,75,0.3)] animate-in zoom-in duration-300">
              <span className="text-gold font-serif text-xl tracking-widest font-bold">{word}</span>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.9); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-600px) scale(1.1); opacity: 0; }
        }
      `}} />
    </div>
  );
}
