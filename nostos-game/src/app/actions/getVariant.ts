"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function getVariant(levelId: string, deviceToken: string, variants: string[]) {
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

  // 2. If no assignment, find which variants are already taken by the team
  const { data: teamAssignments, error: teamError } = await supabase
    .from("level_variant_assignments")
    .select("variant_key")
    .eq("team_id", teamId)
    .eq("level_id", levelId);

  let claimedVariants = new Set<string>();
  if (teamAssignments) {
    teamAssignments.forEach(a => claimedVariants.add(a.variant_key));
  }

  // 3. Find unclaimed variants
  let availableVariants = variants.filter(v => !claimedVariants.has(v));

  // If all variants are claimed (e.g. 4th device), just assign a random one from all variants
  if (availableVariants.length === 0) {
    availableVariants = variants;
  }

  // Pick a random available variant
  const assignedVariant = availableVariants[Math.floor(Math.random() * availableVariants.length)];

  // 4. Save assignment
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
