"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const globalForPath = globalThis as unknown as {
  mockDevPaths?: Record<string, string>;
};

const mockDevPaths = globalForPath.mockDevPaths ?? {};
if (process.env.NODE_ENV !== 'production') {
  globalForPath.mockDevPaths = mockDevPaths;
}

export async function getCommittedPath(levelId: string) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { error: "Not authenticated" };
  }

  const teamId = session.id;

  try {
    const { data, error } = await supabase
      .from("level_variant_assignments")
      .select("variant_key")
      .eq("team_id", teamId)
      .eq("level_id", levelId)
      .eq("device_token", "TEAM_PATH")
      .single();

    if (data && !error) {
      return { path: data.variant_key };
    }
  } catch (err) {
    // fallback
  }
  
  return { path: mockDevPaths[`${teamId}_${levelId}`] || null };
}

export async function commitToPath(levelId: string, pathKey: string) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { error: "Not authenticated" };
  }

  const teamId = session.id;

  try {
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

    if (!error) {
      return { path: pathKey };
    }
  } catch (err) {
    // fallback
  }

  mockDevPaths[`${teamId}_${levelId}`] = pathKey;
  return { path: pathKey };
}
