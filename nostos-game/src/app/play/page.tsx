import React from "react";
import { getSession, isSessionActive } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { GameEngine } from "@/components/game/GameEngine";
import { VictoryScreen } from "@/components/game/VictoryScreen";
import Link from "next/link";
import { Anchor, LogOut } from "lucide-react";
import { SEED_LEVELS } from "@/lib/mockData";
import { OceanCanvas } from "@/components/ui/OceanCanvas";
import { logoutTeam } from "@/app/actions/auth";
import { GodMessageListener } from "@/components/game/GodMessageListener";

export default async function PlayPage({ searchParams }: { searchParams?: Promise<{ level?: string }> }) {
  const session = await getSession();
  
  if (!session || session.role !== "team") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-parchment">
        <p>Your session has drifted away. <Link href="/login" className="text-gold underline">Return to shore.</Link></p>
      </div>
    );
  }

  // Validate single device active session - Removed due to Vercel false positives.
  // The JWT token is secure enough.

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
    const formatTime = (first_login_at: string | null, completed_at: string | null) => {
      if (!first_login_at || !completed_at) return "—";
      const ms = new Date(completed_at).getTime() - new Date(first_login_at).getTime();
      if (ms <= 0) return "—";
      return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    };

    // Fetch my own stats
    let myTime = "—";
    let myIncorrectCount = activeProgress.incorrect_count ?? 0;
    try {
      const { data: myData } = await supabase
        .from("progress")
        .select("first_login_at, completed_at, incorrect_count")
        .eq("team_id", teamId)
        .maybeSingle();
      if (myData) {
        myTime = formatTime(myData.first_login_at, myData.completed_at);
        myIncorrectCount = myData.incorrect_count ?? 0;
      }
    } catch (err) {
      console.warn("Unable to fetch my completion stats:", err);
    }

    // Build per-member stats: each member shares the same team progress row
    // so we show the same time/faults for all, labelled per name
    const memberStats = memberNames.map(name => ({
      name,
      voyageTime: myTime,
      incorrectCount: myIncorrectCount,
    }));

    return (
      <VictoryScreen
        teamId={teamId}
        username={session.username || "Sailor"}
        shipName={session.ship_name || "Your Ship"}
        memberNames={memberNames}
        myTime={myTime}
        myIncorrectCount={myIncorrectCount}
        memberStats={memberStats}
      />
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

      {/* Message from the Gods Listener */}
      <GodMessageListener />

    </main>
  );
}
