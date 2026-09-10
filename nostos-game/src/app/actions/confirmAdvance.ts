"use server";

import { supabase } from "@/lib/supabase";
import { getTeamId } from "./getTeamId";
import { mockDevProgressState } from "@/lib/mockData";
import { revalidatePath } from "next/cache";

export async function confirmAdvance() {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  try {
    const { data: currentProgress, error: fetchErr } = await supabase
      .from("progress")
      .select("current_level, pending_advance")
      .eq("team_id", teamId)
      .single();

    if (!fetchErr && currentProgress && currentProgress.pending_advance) {
      await supabase
        .from("progress")
        .update({ 
          current_level: currentProgress.current_level + 1,
          pending_advance: false
        })
        .eq("team_id", teamId);
    }
  } catch (err) {
    // Fallback to local dev state
    if (mockDevProgressState[teamId]) {
      mockDevProgressState[teamId].current_level += 1;
      mockDevProgressState[teamId].pending_advance = false;
    }
  }

  revalidatePath("/play");
  return { success: true };
}
