import React from "react";
import { getSession, isSessionActive } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { GameEngine } from "@/components/game/GameEngine";
import { TeamSyncProvider } from "@/components/game/TeamSyncProvider";
import { CrewChat } from "@/components/game/CrewChat";
import Link from "next/link";
import { Anchor, LogOut } from "lucide-react";
import { SEED_LEVELS } from "@/lib/mockData";
import { OceanCanvas } from "@/components/ui/OceanCanvas";
import { logoutTeam } from "@/app/actions/auth";

export default async function PlayPage({ searchParams }: { searchParams?: Promise<{ level?: string }> }) {
  const session = await getSession();
  
  if (!session || session.role !== "team") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-parchment">
        <p>Your session has drifted away. <Link href="/login" className="text-gold underline">Return to shore.</Link></p>
      </div>
    );
  }

  // Validate single device active session
  if (session.username && session.sessionId && !isSessionActive(session.id, session.username, session.sessionId)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-parchment p-6 text-center">
        <p className="text-danger text-xl font-serif mb-4">Your session has been logged in on another device.</p>
        <Link href="/login" className="text-gold underline font-serif">Log in again to reclaim your vessel.</Link>
      </div>
    );
  }

  const teamId = session.id;

  // 1. Fetch team progress and registered member names with fallback
  let progress: { current_level: number; incorrect_count: number; aid_tokens: number } | null = null;
  let memberNames: string[] = [];

  try {
    const { data: teamData } = await supabase
      .from("teams")
      .select("member_names")
      .eq("id", teamId)
      .maybeSingle();

    if (teamData?.member_names) {
      memberNames = teamData.member_names;
    }

    const { data, error } = await supabase
      .from("progress")
      .select("current_level, incorrect_count, aid_tokens")
      .eq("team_id", teamId)
      .maybeSingle();

    if (data && !error) {
      progress = data;
    } else if (!error) {
      const { data: newProgress, error: insertErr } = await supabase
        .from("progress")
        .insert([{ 
          team_id: teamId, 
          current_level: 1, 
          first_login_at: new Date().toISOString() 
        }])
        .select("current_level, incorrect_count, aid_tokens")
        .single();
      if (newProgress && !insertErr) progress = newProgress;
    }
  } catch (err) {
    console.warn("Supabase connection unavailable, using local dev progress fallback:", err);
  }

  // Fallback for mockDevTeams or offline progress
  if (!progress) {
    const globalForDev = globalThis as unknown as { mockDevProgress?: Record<string, any> };
    globalForDev.mockDevProgress = globalForDev.mockDevProgress || {};
    if (!globalForDev.mockDevProgress[teamId]) {
      globalForDev.mockDevProgress[teamId] = { current_level: 1, incorrect_count: 0, aid_tokens: 3 };
    }
    progress = globalForDev.mockDevProgress[teamId];
  }

  if (memberNames.length === 0) {
    const globalForDev = globalThis as unknown as { mockDevTeams?: any[] };
    if (globalForDev.mockDevTeams) {
      const mockTeam = globalForDev.mockDevTeams.find((t: any) => t.id === teamId || t.ship_name.toLowerCase() === session.ship_name?.toLowerCase());
      if (mockTeam?.member_names) {
        memberNames = mockTeam.member_names;
      }
    }
  }

  if (memberNames.length === 0) {
    memberNames = [session.username || "Sailor"];
  }

  const activeProgress = progress || { current_level: 1, incorrect_count: 0, aid_tokens: 3 };

  // Strict sequential trial level
  const currentLevelNumber = activeProgress.current_level;

  // 2. Check for game completion
  if (currentLevelNumber > 10) {
    let rank = 1;
    let finalTimeStr = "12m 45s";

    try {
      const { data: allCompleted } = await supabase
        .from("progress")
        .select("team_id, first_login_at, completed_at, incorrect_count")
        .not("completed_at", "is", null);
      
      if (allCompleted) {
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
    } catch (err) {
      console.warn("Unable to fetch leaderboard stats:", err);
    }

    return (
      <TeamSyncProvider teamId={teamId} username={session.username || "Sailor"} memberNames={memberNames}>
        <main className="min-h-screen bg-ink text-parchment flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
           {/* Less Intense Animated Ocean Canvas Background */}
           <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
             <OceanCanvas />
           </div>
           <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.70)_0%,rgba(15,23,37,0.90)_70%,rgba(10,16,25,0.97)_100%)] pointer-events-none z-0" />
           
           <div className="z-10 animate-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
             <Anchor className="w-24 h-24 md:w-32 md:h-32 text-gold mx-auto mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(201,162,75,0.5)]" />
             <h1 className="text-4xl md:text-7xl font-serif text-gold tracking-widest uppercase mb-4 drop-shadow-[0_0_20px_rgba(201,162,75,0.8)]">Home at Last</h1>
             <h2 className="text-2xl md:text-4xl font-serif text-parchment/90 tracking-widest uppercase mb-12">The {session.ship_name} has arrived</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 w-full max-w-4xl bg-[#0B121E]/90 border border-gold/30 p-8 rounded-xl backdrop-blur-md">
               
               <div className="flex flex-col items-center space-y-2">
                 <span className="text-parchment/50 font-serif tracking-widest uppercase text-sm">Voyage Time</span>
                 <span className="text-3xl font-mono text-gold">{finalTimeStr}</span>
               </div>

               <div className="flex flex-col items-center space-y-2 border-y md:border-y-0 md:border-x border-gold/20 py-4 md:py-0">
                 <span className="text-parchment/50 font-serif tracking-widest uppercase text-sm">The Gods Laughed</span>
                 <span className="text-3xl font-mono text-danger">{activeProgress.incorrect_count} <span className="text-sm">times</span></span>
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
        <CrewChat levelId="finished" levelNumber={10} teamId={teamId} />
      </TeamSyncProvider>
    );
  }

  // 3. Fetch the level data with fallback
  let level: any = null;
  
  try {
    const { data: lvlData, error: lvlError } = await supabase
      .from("levels")
      .select("*")
      .eq("level_number", currentLevelNumber)
      .maybeSingle();

    if (lvlData && !lvlError) {
      level = lvlData;
    }
  } catch (err) {
    console.warn("Supabase unavailable, using local mock level data.");
  }

  // Fallback to local mock data if offline
  if (!level) {
    level = SEED_LEVELS.find((l: any) => l.level_number === currentLevelNumber);
  }

  if (!level) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-danger p-6">
        <p>The Oracle cannot find the trial for level {currentLevelNumber}.</p>
      </div>
    );
  }

  // Render the engine
  return (
    <main className="min-h-screen bg-ink text-parchment selection:bg-gold selection:text-ink flex flex-col p-6 md:p-12 relative overflow-hidden">
      {/* Atmospheric Animated Ocean Canvas Background */}
      <div className="fixed inset-0 opacity-65 pointer-events-none z-0">
        <OceanCanvas />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,18,30,0.50)_0%,rgba(11,18,30,0.85)_70%,rgba(6,10,18,0.98)_100%)] pointer-events-none z-0" />
      
      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center mb-12 relative z-10 border-b border-parchment/20 pb-4">
        <div className="flex items-center gap-4">
          <Anchor className="w-8 h-8 text-gold" />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <span className="font-serif text-xl tracking-widest text-gold uppercase">{session.ship_name}</span>
            <span className="text-parchment/70 font-serif italic text-sm border-l border-gold/30 pl-3">
              Sailor: <strong className="text-parchment font-semibold not-italic">{session.username}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-parchment/60 font-serif italic text-sm hidden sm:block">
            Navigating Trial {currentLevelNumber} of 10
          </div>
          <form action={logoutTeam}>
            <button 
              type="submit" 
              title="Log out" 
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-gold/30 bg-[#0B121E]/80 hover:border-gold hover:text-gold text-parchment/80 text-xs font-serif transition-colors"
            >
              <LogOut className="w-4 h-4 text-gold" />
              <span>Leave Ship</span>
            </button>
          </form>
        </div>
      </header>

      {/* The Engine */}
      <GameEngine level={level} progress={activeProgress} teamId={teamId} username={session.username || "Sailor"} memberNames={memberNames} />

    </main>
  );
}
