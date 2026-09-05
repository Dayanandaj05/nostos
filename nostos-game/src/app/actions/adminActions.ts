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
