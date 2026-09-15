"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function overrideTeamLevel(teamId: string, newLevel: number) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("progress")
    .update({ 
      current_level: newLevel,
      last_updated_at: new Date().toISOString()
    })
    .eq("team_id", teamId);

  if (error) return { success: false, error: "Failed to override level." };
  
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleLevelLock(levelId: string, isLocked: boolean) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("levels")
    .update({ is_locked: isLocked })
    .eq("id", levelId);

  if (error) return { success: false, error: "Failed to toggle lock." };
  
  revalidatePath("/admin");
  return { success: true };
}

export async function addIncidentLog(message: string, targetTeamId?: string) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "volunteer")) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("incident_logs")
    .insert([{
      message,
      reported_by: session.username || "Unknown",
      team_id: targetTeamId || null
    }]);

  if (error) return { success: false, error: "Failed to log incident." };
  
  revalidatePath("/admin");
  revalidatePath("/volunteer");
  return { success: true };
}

export async function sendGodMessage(teamId: string, message: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("god_messages")
    .insert([{ team_id: teamId, message }]);

  if (error) return { success: false, error: "Failed to send message." };
  
  return { success: true };
}

export async function getLiveAdminData() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { data: rawTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, ship_name, captain_name, captain_phone, progress(current_level, incorrect_count, correct_count, first_login_at, last_updated_at, completed_at)");

  let teams = (rawTeams || []).map(t => {
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

  // Fallback for dev mode
  if (process.env.NODE_ENV !== "production" && teams.length === 0) {
    const g = globalThis as any;
    if (g.mockDevProgressState) {
      teams = Object.keys(g.mockDevProgressState).map(teamId => {
        const mockTeam = g.mockDevTeams?.find((t: any) => t.id === teamId) || { ship_name: "Dev Team " + teamId.substring(0,4) };
        return {
          team_id: teamId,
          ...g.mockDevProgressState[teamId],
          teams: mockTeam
        };
      });
    }
  }

  return { teams };
}
