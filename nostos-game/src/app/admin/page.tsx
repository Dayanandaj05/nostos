import React from "react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Fetch all necessary data
  const { data: teams } = await supabase
    .from("progress")
    .select("*, teams(ship_name, captain_name, captain_phone)")
    .order("current_level", { ascending: false });

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
