import React from "react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { GameEngine } from "@/components/game/GameEngine";
import Link from "next/link";
import { Anchor } from "lucide-react";

export default async function PlayPage() {
  const session = await getSession();
  
  if (!session || session.role !== "team") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-parchment">
        <p>Your session has drifted away. <Link href="/login" className="text-gold underline">Return to shore.</Link></p>
      </div>
    );
  }

  const teamId = session.id;

  // 1. Fetch team progress
  let { data: progress, error: progError } = await supabase
    .from("progress")
    .select("current_level, incorrect_count")
    .eq("team_id", teamId)
    .maybeSingle();

  // If no progress exists, this is their first login. Initialize it.
  if (!progress) {
    const { data: newProgress, error: insertError } = await supabase
      .from("progress")
      .insert([{ 
        team_id: teamId, 
        current_level: 1, 
        first_login_at: new Date().toISOString() 
      }])
      .select("current_level, incorrect_count")
      .single();
      
    if (insertError || !newProgress) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-danger p-6">
          <p>Failed to record your arrival in the logs. The Oracle is silent.</p>
        </div>
      );
    }
    progress = newProgress;
  }

  const currentLevelNumber = progress.current_level;

  // 2. Check for game completion
  if (currentLevelNumber > 10) {
    // Fetch rank and stats
    const { data: allCompleted } = await supabase
      .from("progress")
      .select("team_id, first_login_at, completed_at, incorrect_count")
      .not("completed_at", "is", null);

    let rank = 1;
    let finalTimeStr = "Unknown";
    
    if (allCompleted) {
      // Calculate times and sort
      const sorted = allCompleted.map(t => {
        const start = new Date(t.first_login_at || 0).getTime();
        const end = new Date(t.completed_at || 0).getTime();
        const duration = end - start;
        return { ...t, duration };
      }).sort((a, b) => {
        if (a.duration === b.duration) return a.incorrect_count - b.incorrect_count;
        return a.duration - b.duration;
      });

      const myIndex = sorted.findIndex(t => t.team_id === teamId);
      if (myIndex !== -1) {
        rank = myIndex + 1;
        const ms = sorted[myIndex].duration;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        finalTimeStr = `${minutes}m ${seconds}s`;
      }
    }

    return (
      <main className="min-h-screen bg-ink text-parchment flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
             style={{ backgroundImage: 'radial-gradient(circle at center, #C9A24B 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
         
         <div className="z-10 animate-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
           <Anchor className="w-24 h-24 md:w-32 md:h-32 text-gold mx-auto mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(201,162,75,0.5)]" />
           <h1 className="text-4xl md:text-7xl font-serif text-gold tracking-widest uppercase mb-4 drop-shadow-[0_0_20px_rgba(201,162,75,0.8)]">Home at Last</h1>
           <h2 className="text-2xl md:text-4xl font-serif text-parchment/90 tracking-widest uppercase mb-12">The {session.ship_name} has arrived</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 w-full max-w-4xl bg-ink/50 border border-gold/30 p-8 rounded-xl backdrop-blur-md">
             
             <div className="flex flex-col items-center space-y-2">
               <span className="text-parchment/50 font-serif tracking-widest uppercase text-sm">Voyage Time</span>
               <span className="text-3xl font-mono text-gold">{finalTimeStr}</span>
             </div>

             <div className="flex flex-col items-center space-y-2 border-y md:border-y-0 md:border-x border-gold/20 py-4 md:py-0">
               <span className="text-parchment/50 font-serif tracking-widest uppercase text-sm">The Gods Laughed</span>
               <span className="text-3xl font-mono text-danger">{progress.incorrect_count} <span className="text-sm">times</span></span>
             </div>

             <div className="flex flex-col items-center space-y-2">
               <span className="text-parchment/50 font-serif tracking-widest uppercase text-sm">Leaderboard Rank</span>
               <span className="text-4xl font-serif font-bold text-gold">#{rank}</span>
             </div>

           </div>
           
           <p className="mt-12 text-lg md:text-2xl font-serif italic text-parchment/60 max-w-2xl">
             You have navigated the trials, bested the gods, and reached the shores of Ithaca. Your legend is eternal.
           </p>
         </div>
      </main>
    );
  }

  // 3. Fetch the level data
  const { data: level, error: lvlError } = await supabase
    .from("levels")
    .select("*")
    .eq("level_number", currentLevelNumber)
    .single();

  if (lvlError || !level) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-danger p-6">
        <p>The Oracle cannot find the trial for level {currentLevelNumber}.</p>
      </div>
    );
  }

  // Render the engine
  return (
    <main className="min-h-screen bg-ink text-parchment selection:bg-gold selection:text-ink flex flex-col p-6 md:p-12 relative">
      {/* Deep Sea / Epic Background elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0A1017] via-ink to-[#151c22] z-0" />
      <div className="fixed inset-0 opacity-10 pointer-events-none mix-blend-overlay z-0"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center mb-12 relative z-10 border-b border-parchment/20 pb-4">
        <div className="flex items-center gap-4">
          <Anchor className="w-8 h-8 text-gold" />
          <span className="font-serif text-xl tracking-widest text-gold uppercase">{session.ship_name}</span>
        </div>
        <div className="text-parchment/60 font-serif italic text-sm">
          Navigating Trial {currentLevelNumber} of 10
        </div>
      </header>

      {/* The Engine */}
      <GameEngine level={level} incorrectCount={progress.incorrect_count} />

    </main>
  );
}
