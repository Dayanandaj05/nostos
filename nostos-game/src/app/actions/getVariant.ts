"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function getVariant(levelId: string, deviceToken: string, variants: string[]) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { error: "Not authenticated" };
  }

  const teamId = session.id;

  try {
    // Add a random jitter (0 - 1500ms) to prevent race conditions when all 
    // teammates transition to this trial at the exact same millisecond.
    // This allows one teammate to insert their assignment before the next one checks.
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500));

    // 1. Check if this device already has an assignment for this level
    const { data: existing, error: fetchError } = await supabase
      .from("level_variant_assignments")
      .select("variant_key")
      .eq("team_id", teamId)
      .eq("level_id", levelId)
      .eq("device_token", deviceToken)
      .single();

    if (existing && !fetchError) {
      return { variant_key: existing.variant_key };
    }

    // 2. If no assignment, find which variants are already taken by the team
    const { data: teamAssignments, error: teamError } = await supabase
      .from("level_variant_assignments")
      .select("variant_key")
      .eq("team_id", teamId)
      .eq("level_id", levelId);

    let claimedVariants = new Set<string>();
    if (teamAssignments && !teamError) {
      teamAssignments.forEach(a => claimedVariants.add(a.variant_key));
    }

    // 3. Find unclaimed variants
    let availableVariants = variants.filter(v => !claimedVariants.has(v));
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

    if (!insertError) {
      return { variant_key: assignedVariant };
    }
  } catch (err) {
    console.warn("Supabase variant assignment unavailable, using local fallback:", err);
  }

  // Fallback if Supabase is offline/unreachable: return a deterministic variant for this device
  const charCodeSum = deviceToken.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackVariant = variants[charCodeSum % variants.length] || variants[0];
  return { variant_key: fallbackVariant };
}
