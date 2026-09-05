"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function getSirensVariant(levelId: string, deviceToken: string) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { error: "Not authenticated" };
  }

  const teamId = session.id;

  // 1. Check if this device already has an assignment for this level
  const { data: existing, error: fetchError } = await supabase
    .from("level_variant_assignments")
    .select("variant_key")
    .eq("team_id", teamId)
    .eq("level_id", levelId)
    .eq("device_token", deviceToken)
    .single();

  if (existing) {
    return { variant_key: existing.variant_key };
  }

  // 2. If no assignment, count how many assignments exist for this team + level
  const { count, error: countError } = await supabase
    .from("level_variant_assignments")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("level_id", levelId);

  // If count is 0, this is the very first device -> "blurred"
  // Otherwise, -> "clear"
  const assignedVariant = count === 0 ? "blurred" : "clear";

  // 3. Save assignment
  const { error: insertError } = await supabase
    .from("level_variant_assignments")
    .insert([{
      team_id: teamId,
      level_id: levelId,
      device_token: deviceToken,
      variant_key: assignedVariant
    }]);

  if (insertError) {
    // If there was a race condition and it was inserted, try fetching it again
    const { data: retry } = await supabase
      .from("level_variant_assignments")
      .select("variant_key")
      .eq("team_id", teamId)
      .eq("level_id", levelId)
      .eq("device_token", deviceToken)
      .single();
    
    if (retry) {
      return { variant_key: retry.variant_key };
    }
    return { error: "Failed to assign variant" };
  }

  return { variant_key: assignedVariant };
}
