"use server";

import { supabase } from "@/lib/supabase";
import { getTeamId } from "./getTeamId";
import { SEED_LEVELS } from "@/lib/mockData";
import { revalidatePath } from "next/cache";

export async function useAidToken() {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  try {
    const { data: currentProgress, error: fetchErr } = await supabase
      .from("progress")
      .select("aid_tokens")
      .eq("team_id", teamId)
      .maybeSingle();

    if (!fetchErr && currentProgress && currentProgress.aid_tokens > 0) {
      await supabase
        .from("progress")
        .update({ 
          aid_tokens: currentProgress.aid_tokens - 1
        })
        .eq("team_id", teamId);
      revalidatePath("/play");
      return { success: true };
    }
    
    return { success: false, error: "No aid tokens remaining." };
  } catch (err) {
    console.error(`[useAidToken] Unexpected error for team ${teamId}:`, err);
    return { success: false, error: "Database error" };
  }
}
