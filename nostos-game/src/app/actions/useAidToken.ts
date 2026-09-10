"use server";

import { supabase } from "@/lib/supabase";
import { getTeamId } from "./getTeamId";
import { mockDevProgressState } from "@/lib/mockData";
import { revalidatePath } from "next/cache";

export async function useAidToken() {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  try {
    const { data: currentProgress, error: fetchErr } = await supabase
      .from("progress")
      .select("aid_tokens")
      .eq("team_id", teamId)
      .single();

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
    // Fallback to local dev state
    if (mockDevProgressState[teamId] && mockDevProgressState[teamId].aid_tokens > 0) {
      mockDevProgressState[teamId].aid_tokens -= 1;
      revalidatePath("/play");
      return { success: true };
    }
    return { success: false, error: "No aid tokens remaining." };
  }
}
