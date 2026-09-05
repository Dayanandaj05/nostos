"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function getCommittedPath(levelId: string) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { error: "Not authenticated" };
  }

  const teamId = session.id;

  const { data, error } = await supabase
    .from("level_variant_assignments")
    .select("variant_key")
    .eq("team_id", teamId)
    .eq("level_id", levelId)
    .eq("device_token", "TEAM_PATH")
    .single();

  if (data) {
    return { path: data.variant_key };
  }
  
  return { path: null };
}

export async function commitToPath(levelId: string, pathKey: string) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { error: "Not authenticated" };
  }

  const teamId = session.id;

  // Verify it doesn't already exist to prevent race conditions overriding
  const { data: existing } = await supabase
    .from("level_variant_assignments")
    .select("variant_key")
    .eq("team_id", teamId)
    .eq("level_id", levelId)
    .eq("device_token", "TEAM_PATH")
    .single();

  if (existing) {
    return { path: existing.variant_key };
  }

  const { error } = await supabase
    .from("level_variant_assignments")
    .insert([{
      team_id: teamId,
      level_id: levelId,
      device_token: "TEAM_PATH",
      variant_key: pathKey
    }]);

  if (error) {
    return { error: "Failed to commit path" };
  }

  return { path: pathKey };
}
