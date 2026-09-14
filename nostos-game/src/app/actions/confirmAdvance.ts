"use server";

import { supabase } from "@/lib/supabase";
import { getTeamId } from "./getTeamId";
import { revalidatePath } from "next/cache";

export async function confirmAdvance(fromLevelNumber?: number) {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  const { data: currentProgress, error: fetchError } = await supabase
    .from("progress")
    .select("current_level")
    .eq("team_id", teamId)
    .maybeSingle();

  if (fetchError || !currentProgress) {
    console.error(`[confirmAdvance] Error fetching progress for team ${teamId}:`, fetchError);
    return { success: false, error: "Database error" };
  }

  // Guard against race conditions & double calls:
  // Only advance if current_level matches fromLevelNumber (if specified)
  if (fromLevelNumber !== undefined && currentProgress.current_level !== fromLevelNumber) {
    console.log(`[confirmAdvance] Team ${teamId} already advanced past level ${fromLevelNumber} (current: ${currentProgress.current_level}). Skipping.`);
    revalidatePath("/play");
    return { success: true };
  }

  const nextLevel = currentProgress.current_level + 1;
  const isFinished = nextLevel > 10;
  
  const updateData: any = { 
    current_level: nextLevel,
    pending_advance: false,
    last_updated_at: new Date().toISOString()
  };
  
  if (isFinished) {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("progress")
    .update(updateData)
    .eq("team_id", teamId);

  if (error) {
    console.error(`[confirmAdvance] Error advancing team ${teamId}:`, error);
    return { success: false, error: "Failed to advance level." };
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
