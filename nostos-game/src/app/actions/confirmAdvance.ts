"use server";

import { supabase } from "@/lib/supabase";
import { getTeamId } from "./getTeamId";
import { mockDevProgressState } from "@/lib/mockData";
import { revalidatePath } from "next/cache";

export async function confirmAdvance() {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  let updatedInDb = false;

  try {
    const { data: currentProgress, error: fetchErr } = await supabase
      .from("progress")
      .select("current_level, pending_advance")
      .eq("team_id", teamId)
      .single();

    if (!fetchErr && currentProgress) {
      if (currentProgress.pending_advance) {
        const { error: updateErr } = await supabase
          .from("progress")
          .update({ 
            current_level: currentProgress.current_level + 1,
            pending_advance: false,
            last_updated_at: new Date().toISOString()
          })
          .eq("team_id", teamId);

        if (!updateErr) {
          updatedInDb = true;
          console.log(`[confirmAdvance] Advanced team ${teamId} to level ${currentProgress.current_level + 1} in DB`);
        } else {
          console.error("[confirmAdvance] Error updating progress in DB:", updateErr);
        }
      } else {
        // pending_advance is already false - team was already advanced by a teammate
        updatedInDb = true;
      }
    } else if (fetchErr) {
      console.warn("[confirmAdvance] Fetch progress error:", fetchErr);
    }
  } catch (err) {
    console.warn("[confirmAdvance] Exception during DB advance, using fallback:", err);
  }

  // Fallback if Supabase update did not succeed (e.g. offline / local dev mock)
  if (!updatedInDb) {
    if (!mockDevProgressState[teamId]) {
      mockDevProgressState[teamId] = { current_level: 1, incorrect_count: 0, aid_tokens: 3, pending_advance: false };
    }
    if (mockDevProgressState[teamId].pending_advance) {
      mockDevProgressState[teamId].current_level += 1;
      mockDevProgressState[teamId].pending_advance = false;
      console.log(`[confirmAdvance] Fallback updated mock state for team ${teamId} to level ${mockDevProgressState[teamId].current_level}`);
    } else {
      console.log(`[confirmAdvance] Fallback mock state for team ${teamId} already at level ${mockDevProgressState[teamId].current_level} (pending_advance was false)`);
    }
  }

  revalidatePath("/play");
  return { success: true };
}

export async function setTeamLevel(targetLevel: number) {
  const teamId = await getTeamId();
  if (!teamId) return { success: false, error: "Not authenticated" };

  try {
    await supabase
      .from("progress")
      .update({ 
        current_level: targetLevel,
        pending_advance: false,
        last_updated_at: new Date().toISOString()
      })
      .eq("team_id", teamId);
  } catch (err) {
    console.warn("[setTeamLevel] Error updating DB level:", err);
  }

  if (!mockDevProgressState[teamId]) {
    mockDevProgressState[teamId] = { current_level: targetLevel, incorrect_count: 0, aid_tokens: 3, pending_advance: false };
  } else {
    mockDevProgressState[teamId].current_level = targetLevel;
    mockDevProgressState[teamId].pending_advance = false;
  }

  revalidatePath("/play");
  return { success: true };
}
