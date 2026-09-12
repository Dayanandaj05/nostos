"use server";

import { supabase } from "@/lib/supabase";
import { getTeamId } from "./getTeamId";
import { revalidatePath } from "next/cache";

export async function confirmAdvance() {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  const { data: currentProgress, error: fetchError } = await supabase
    .from("progress")
    .select("current_level, pending_advance")
    .eq("team_id", teamId)
    .single();

  if (fetchError) {
    console.error(`[confirmAdvance] Error fetching progress for team ${teamId}:`, fetchError);
    return { success: false, error: "Database error" };
  }

  if (currentProgress?.pending_advance) {
    const { error } = await supabase
      .from("progress")
      .update({ 
        current_level: currentProgress.current_level + 1,
        pending_advance: false,
        last_updated_at: new Date().toISOString()
      })
      .eq("team_id", teamId);

    if (error) {
      console.error(`[confirmAdvance] Error advancing team ${teamId}:`, error);
      return { success: false, error: "Failed to advance level." };
    }
  }

  revalidatePath("/play");
  return { success: true };
}

export async function setTeamLevel(targetLevel: number) {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("progress")
    .update({ 
      current_level: targetLevel,
      pending_advance: false,
      last_updated_at: new Date().toISOString()
    })
    .eq("team_id", teamId);

  if (error) {
    console.error(`[setTeamLevel] Error setting level for team ${teamId}:`, error);
    return { success: false, error: "Failed to set level." };
  }

  revalidatePath("/play");
  return { success: true };
}
