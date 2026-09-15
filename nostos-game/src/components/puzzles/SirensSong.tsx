"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSirensVariant } from "@/app/actions/getSirensVariant";
import { getTeamId } from "@/app/actions/getTeamId";
import { supabase } from "@/lib/supabase";
import { Loader2, Ear, AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface SirensSongProps {
  levelId: string;
  storyText?: string;
  children?: React.ReactNode;
}

const WAVES = [
  { 
    wave: 1, 
    gold: "TRUST", 
    clue: "Confidence in your fleet and sailors...",
    fakes: ["SAIL", "LISTEN", "STAY", "COME", "HEAR", "REST", "SLEEP", "JOIN"] 
  },
  { 
    wave: 2, 
    gold: "NO", 
    clue: "The absolute refusal to give in to temptation...",
    fakes: ["YES", "THE", "A", "AND", "OR", "BUT", "IF", "SO"] 
  },
  { 
    wave: 3, 
    gold: "SONG", 
    clue: "The deadly music echoing across the waves...",
    fakes: ["WIND", "SEA", "WAVE", "VOICE", "CALL", "CRY", "TEAR", "DEPTH"] 
  },
];

type Bubble = {
  id: string;
  word: string;
  isGold: boolean;
  left: number; // percentage
  delay: number; // seconds
  size: number; // scale
};

const LANES = [12, 30, 50, 70, 85]; // 5 clean horizontal lanes to prevent word overlapping

export function SirensSong({ levelId, storyText, children }: SirensSongProps) {
  const [variant, setVariant] = useState<string | null>(null);
  const [teamId, setLocalTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [playing, setPlaying] = useState(false);
  const [activeWave, setActiveWave] = useState(0);
  const [riddleOverlay, setRiddleOverlay] = useState<{ waveIdx: number; text: string } | null>(null);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  
  const [tray, setTray] = useState<string[]>([]);
  const [hasSeenAllRiddles, setHasSeenAllRiddles] = useState(false);
  
  const channelRef = useRef<any>(null);

  // Init Variant and Realtime Channel instantly
  useEffect(() => {
    let isMounted = true;
    let token = sessionStorage.getItem("nostos_device_token");
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem("nostos_device_token", token);
    }

    setVariant("clear");
    setLoading(false);

    getSirensVariant(levelId, token).then(vRes => {
      if (isMounted && vRes && vRes.variant_key) {
        setVariant(vRes.variant_key);
      }
    });

    getTeamId().then(tid => {
      if (isMounted && tid) {
        setLocalTeamId(tid);
        const channel = supabase.channel(`sirens_${tid}`, {
          config: { broadcast: { self: true } }
        });
        
        channel.on('broadcast', { event: 'update_tray' }, (payload) => {
          if (isMounted) setTray(payload.payload.tray);
        }).on('broadcast', { event: 'all_riddles_seen' }, () => {
          if (isMounted) setHasSeenAllRiddles(true);
        }).subscribe();
        
        channelRef.current = channel;
      }
    });

    return () => {
      isMounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [levelId]);

  // Timed Sequence for 5-second full box riddle overlays & wave progression
  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];

    if (playing) {
      // WAVE 1 (0s to 15s)
      setActiveWave(0);
      setRiddleOverlay({ waveIdx: 0, text: WAVES[0].clue }); // 0s to 5s Overlay

      timers.push(setTimeout(() => {
        setRiddleOverlay(null); // Fade out overlay at 5s -> words ascend from 5s to 15s
      }, 5000));

      // WAVE 2 (15s to 30s)
      timers.push(setTimeout(() => {
        setActiveWave(1);
        setRiddleOverlay({ waveIdx: 1, text: WAVES[1].clue }); // 15s to 20s Overlay
      }, 15000));

      timers.push(setTimeout(() => {
        setRiddleOverlay(null); // Fade out overlay at 20s -> words ascend from 20s to 30s
      }, 20000));

      // WAVE 3 (30s to 45s)
      timers.push(setTimeout(() => {
        setActiveWave(2);
        setRiddleOverlay({ waveIdx: 2, text: WAVES[2].clue }); // 30s to 35s Overlay
        setHasSeenAllRiddles(true);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'all_riddles_seen',
          payload: {}
        });
      }, 30000));

      timers.push(setTimeout(() => {
        setRiddleOverlay(null); // Fade out overlay at 35s -> words ascend from 35s to 45s
      }, 35000));

      // End Playback at 46s
      timers.push(setTimeout(() => {
        setPlaying(false);
        setBubbles([]);
        setRiddleOverlay(null);
        setHasSeenAllRiddles(true);
      }, 46000));

    } else {
      setRiddleOverlay(null);
      setActiveWave(0);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [playing]);

  // Sync tray to the main GameEngine form
  useEffect(() => {
    const input = document.getElementById('oracle-form')?.querySelector('input[name="answer"]') as HTMLInputElement;
    if (input && tray.length > 0) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, tray.join(" "));
      } else {
        input.value = tray.join(" ");
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [tray]);

  const handlePlay = () => {
    if (lockedOut || playing) return;
    
    if (rewatchCount >= 3) {
      setLockedOut(true);
      setTimeout(() => {
        setLockedOut(false);
        setRewatchCount(0);
      }, 10000);
      return;
    }

    setPlaying(true);
    setRewatchCount(prev => prev + 1);

    // Generate natural floating bubbles with organic spacing & slight overlap
    const newBubbles: Bubble[] = [];

    WAVES.forEach((waveData, wIdx) => {
      // Wave 0 words ascend from 5s to 15s
      // Wave 1 words ascend from 20s to 30s
      // Wave 2 words ascend from 35s to 45s
      const waveStartDelay = wIdx * 15 + 5; 
      
      const allWords = [
        ...waveData.fakes.slice(0, 3).map(w => ({ word: w, isGold: false })),
        { word: waveData.gold, isGold: true },
        ...waveData.fakes.slice(3, 6).map(w => ({ word: w, isGold: false }))
      ];

      // Shuffle order of words
      const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);

      shuffledWords.forEach((item, i) => {
        // Natural organic horizontal placement with slight overlap (range ~12% to 76%)
        const baseLeft = 14 + (i * 9); 
        const randomOffset = Math.random() * 10 - 5; // Slight drift
        const leftPos = Math.max(10, Math.min(76, baseLeft + randomOffset));
        const timeStagger = i * 0.9; // Stagger by 0.9s per word

        newBubbles.push({
          id: `w${wIdx}-${i}`,
          word: item.word,
          isGold: item.isGold,
          left: leftPos,
          delay: waveStartDelay + timeStagger,
          size: item.isGold ? 1.15 : 0.9,
        });
      });
    });
    
    setBubbles(newBubbles);
  };

  const handleCapture = (word: string, isGold: boolean) => {
    if (variant === "blurred") return;
    
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
    <div className="w-full select-none pb-4">
      
      {/* Dynamic Keyframes for Natural 10s Bubble Float with Organic Sway */}
      <style>{`
        @keyframes floatUpSlow {
          0% { transform: translateY(0) translateX(0px); opacity: 0; }
          15% { opacity: 1; transform: translateY(-70px) translateX(14px); }
          50% { opacity: 1; transform: translateY(-260px) translateX(-12px); }
          85% { opacity: 1; transform: translateY(-450px) translateX(10px); }
          100% { transform: translateY(-560px) translateX(0px); opacity: 0; }
        }
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Hidden children form so oracle-form exists in DOM */}
      <div className="hidden">{children}</div>

      {/* Main Grid: Left = Story + Black Box, Right = Enigma + Team Banner + Sense Status + Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* LEFT COLUMN (7 cols): Story Narrative Card + Black Box Container */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Story Card */}
          {storyText && (
            <Card className="bg-ink/60 border border-wave/20 p-6 md:p-8 shadow-2xl backdrop-blur-md rounded-2xl">
              <div className="prose prose-invert prose-p:font-serif prose-p:text-lg md:prose-p:text-xl prose-p:leading-relaxed prose-p:text-parchment/90 max-w-none">
                {storyText.split('\n\n').map((paragraph: string, i: number) => (
                  <p key={i}>
                    {i === 0 ? (
                      <span className="float-left text-6xl md:text-7xl font-bold text-gold mr-3 mt-1 leading-none font-serif uppercase">
                        {paragraph.charAt(0)}
                      </span>
                    ) : null}
                    {i === 0 ? paragraph.slice(1) : paragraph}
                  </p>
                ))}
              </div>
            </Card>
          )}

          {/* The Sea of Voices (Black Box Container) */}
          <div className="relative w-full h-[460px] bg-[#020617] border-2 border-gold/30 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Deep Ocean Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/25 via-black to-black" />

            {/* FULL-BOX 5-SECOND RIDDLE OVERLAY */}
            {riddleOverlay && (
              <div className="absolute inset-0 z-40 bg-[#0A0E17]/95 border-2 border-gold/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
                <div className="flex items-center space-x-2 text-gold bg-gold/15 border border-gold/40 px-4 py-1.5 rounded-full text-xs font-serif uppercase tracking-widest font-bold">
                  <Sparkles className="w-4 h-4 text-gold animate-spin" />
                  <span>Siren Wave {riddleOverlay.waveIdx + 1} of 3 Riddle</span>
                </div>

                <div className="space-y-3 max-w-lg">
                  <p className="text-parchment font-serif italic text-lg md:text-xl font-semibold leading-relaxed drop-shadow-md">
                    "{riddleOverlay.text}"
                  </p>
                  <p className="text-parchment/60 font-serif text-xs italic">
                    Floating melody words will ascend slowly once this riddle overlay fades out...
                  </p>
                </div>

                {/* 5-second progress countdown bar */}
                <div className="w-full max-w-sm h-2 bg-black/60 border border-gold/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ animation: 'progressFill 5s linear forwards' }} />
                </div>
              </div>
            )}

            {/* Floating Words (Slow 10s float with natural sway) */}
            <div className={`absolute inset-0 w-full h-full ${variant === 'blurred' ? 'blur-[10px] opacity-70 pointer-events-none' : ''}`}>
              {bubbles.map(b => (
                <div
                  key={b.id}
                  onClick={() => handleCapture(b.word, b.isGold)}
                  className="absolute bottom-[-90px] flex items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 transition-all cursor-pointer hover:bg-gold/20 hover:border-gold shadow-lg"
                  style={{
                    left: `${b.left}%`,
                    width: `${85 * b.size}px`,
                    height: `${85 * b.size}px`,
                    animation: `floatUpSlow 10s linear forwards`,
                    animationDelay: `${b.delay}s`,
                  }}
                >
                  <span className="font-serif tracking-widest font-bold text-sm md:text-base text-blue-100 drop-shadow-md">
                    {b.word}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Centered Start Prompt when Idle */}
            {!playing && !lockedOut && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#0B121E]/95 border-2 border-gold/50 p-6 rounded-2xl backdrop-blur-md shadow-[0_0_40px_rgba(201,162,75,0.3)] flex flex-col items-center text-center space-y-4 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-gold shadow-[0_0_15px_rgba(201,162,75,0.6)]">
                    <Ear className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-gold font-serif text-lg font-bold tracking-widest uppercase">The Sirens' Song Awaits</h4>
                    <p className="text-parchment/80 font-serif text-xs italic leading-relaxed">
                      Listen to each 5-second riddle, then capture the floating melody words.
                    </p>
                  </div>

                  <button
                    onClick={handlePlay}
                    className="w-full py-3 bg-gold hover:bg-gold-light text-ink font-serif text-sm font-bold uppercase tracking-widest rounded-xl shadow-xl transition-all hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Ear className="w-4 h-4" />
                    <span>Listen to Song ({rewatchCount}/3)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (5 cols): Enigma Heading + Team Strategy Banner + Sense Status + Captured Memory */}
        <div className="lg:col-span-5 space-y-5">
          
          <h3 className="text-xl text-gold/80 tracking-widest uppercase font-serif border-b border-gold/10 pb-2">
            The Enigma
          </h3>

          {/* Team Strategy Banner */}
          <div className="w-full bg-[#0B121E] border border-gold/30 p-4 rounded-xl shadow-lg relative overflow-hidden flex items-start space-x-3">
            <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0 mt-0.5">
              <Ear className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-gold font-serif text-xs uppercase tracking-widest font-bold mb-0.5">
                Team Sensory Communication
              </p>
              <p className="text-parchment/80 font-serif text-xs italic leading-relaxed">
                Only <strong>one crew member</strong> can see unblurred words. Read the 5-second riddle, then click the floating words!
              </p>
            </div>
          </div>

          {/* Sense Status & Memory Tray Card */}
          <div className="bg-[#0B121E] border border-gold/30 p-5 rounded-2xl shadow-xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-gold/20 pb-3">
              <div className="flex flex-col">
                <span className="text-parchment/50 font-serif text-xs tracking-widest uppercase">Your Sense</span>
                <span className={`font-serif text-base tracking-widest uppercase font-bold ${variant === 'blurred' ? 'text-zinc-500' : 'text-gold drop-shadow-[0_0_10px_rgba(201,162,75,0.8)]'}`}>
                  {variant === 'blurred' ? 'Deafened' : 'Listening'}
                </span>
              </div>

              {lockedOut ? (
                <div className="text-danger flex items-center space-x-1 animate-pulse text-xs font-serif uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Wait...</span>
                </div>
              ) : (
                <button
                  onClick={handlePlay}
                  disabled={playing}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg font-serif text-xs uppercase tracking-widest font-bold transition-all ${
                    playing ? 'border-zinc-700 text-zinc-600 cursor-not-allowed' : 'border-gold/50 text-gold hover:bg-gold/15 bg-gold/5'
                  }`}
                >
                  <Ear className="w-3.5 h-3.5" />
                  <span>{playing ? 'Listening...' : `Listen (${rewatchCount}/3)`}</span>
                </button>
              )}
            </div>

            {/* Captured Memory Section */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gold font-serif text-xs uppercase tracking-widest font-bold">
                  Captured Memory
                </span>
                {tray.length > 0 && (
                  <button onClick={clearTray} className="text-danger/80 hover:text-danger text-xs font-serif underline">
                    Clear
                  </button>
                )}
              </div>

              <div className="min-h-[110px] w-full border border-gold/20 bg-black/60 rounded-xl p-3 flex flex-wrap gap-2 items-center justify-center shadow-inner">
                {tray.length === 0 ? (
                  <p className="text-parchment/40 font-serif italic text-xs text-center leading-relaxed">
                    Captured melody words will appear here...
                  </p>
                ) : (
                  tray.map((word, i) => (
                    <div key={i} className="px-3.5 py-1.5 bg-gold/20 border-2 border-gold text-gold font-serif font-bold text-base rounded-lg tracking-widest shadow-[0_0_12px_rgba(201,162,75,0.4)] animate-in zoom-in">
                      {word}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Answer Button - Only unlocks after seeing all 3 riddles */}
            {hasSeenAllRiddles || tray.length >= 3 ? (
              tray.length > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("nostos-oracle-submit", { detail: tray.join(" ") }));
                  }}
                  className="w-full py-3 bg-gold hover:bg-gold-light text-ink font-serif text-sm font-bold uppercase tracking-widest rounded-xl shadow-xl transition-all hover:scale-102 flex items-center justify-center space-x-2"
                >
                  <span>Submit Answer: {tray.join(" ")} →</span>
                </button>
              ) : (
                <p className="text-gold/50 font-serif text-[11px] italic text-center uppercase tracking-widest pt-1">
                  (CLICK GOLD MELODY BUBBLES TO CAPTURE WORDS)
                </p>
              )
            ) : (
              <p className="text-gold/60 font-serif text-[11px] italic text-center uppercase tracking-widest pt-1">
                (Listen to all 3 siren riddles to unlock submission)
              </p>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
