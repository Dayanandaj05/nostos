import React from "react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { AdminClient } from "./AdminClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Fetch all necessary data
  const { data: rawTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, ship_name, captain_name, captain_phone, progress(current_level, incorrect_count, correct_count, first_login_at, last_updated_at, completed_at)");

  if (teamsError) {
    console.error("Supabase Error fetching teams in Admin:", teamsError);
  }

  // Map to the structure expected by AdminClient
  const teams = (rawTeams || []).map(t => {
    const prog = t.progress ? (Array.isArray(t.progress) ? t.progress[0] : t.progress) : null;
    return {
      team_id: t.id,
      current_level: prog?.current_level || 1,
      incorrect_count: prog?.incorrect_count || 0,
      correct_count: prog?.correct_count || 0,
      first_login_at: prog?.first_login_at || null,
      last_updated_at: prog?.last_updated_at || null,
      completed_at: prog?.completed_at || null,
      teams: {
        ship_name: t.ship_name,
        captain_name: t.captain_name,
        captain_phone: t.captain_phone
      }
    };
  }).sort((a, b) => b.current_level - a.current_level);

  const { data: levels } = await supabase
    .from("levels")
    .select("id, level_number, is_locked")
    .order("level_number", { ascending: true });

  const { data: logs } = await supabase
    .from("incident_logs")
    .select("*, teams(ship_name, captain_name, captain_phone)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fallback to local dev memory state if Supabase fails or is empty in dev
  let finalTeams = teams || [];
  let finalLevels = levels || [];
  let finalLogs = logs || [];

  if (process.env.NODE_ENV !== "production" && finalTeams.length === 0) {
    const g = globalThis as any;
    if (g.mockDevProgressState) {
      finalTeams = Object.keys(g.mockDevProgressState).map(teamId => {
        const mockTeam = g.mockDevTeams?.find((t: any) => t.id === teamId) || { ship_name: "Dev Team " + teamId.substring(0,4) };
        return {
          team_id: teamId,
          ...g.mockDevProgressState[teamId],
          teams: mockTeam
        };
      });
    }
  }

  // Fallback levels if empty
  if (process.env.NODE_ENV !== "production" && finalLevels.length === 0) {
    const { SEED_LEVELS } = await import("@/lib/mockData");
    finalLevels = SEED_LEVELS.map(l => ({ id: l.id, level_number: l.level_number, is_locked: l.is_locked }));
  }

  return (
    <AdminClient 
      teams={finalTeams} 
      levels={finalLevels} 
      logs={finalLogs} 
      currentUsername={session.username} 
    />
  );
}
