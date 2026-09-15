"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export type RegisterState = {
  success: boolean;
  errors?: {
    ship_name?: string;
    password?: string;
    member_names?: string;
    general?: string;
  };
};

export async function registerTeam(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const ship_name = formData.get("ship_name")?.toString().trim();
  const password = formData.get("password")?.toString();

  // Build member_names: slot 1 is always the captain
  const member_names: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const member = formData.get(`member_${i}`)?.toString().trim();
    if (member) member_names.push(member);
  }

  const errors: RegisterState["errors"] = {};

  if (!ship_name) errors.ship_name = "A ship must have a name.";
  if (!password || password.trim().length < 1) errors.password = "The password must be at least 1 character.";
  if (member_names.length < 3) errors.member_names = "A crew requires at least 3 members.";

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    const { data: existingTeam, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .ilike("ship_name", ship_name!)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingTeam) {
      return { success: false, errors: { ship_name: "That ship is already sailing these waters." } };
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password!, salt);

    const { data: newTeam, error: insertError } = await supabase
      .from("teams")
      .insert([{ ship_name, password_hash, member_names }])
      .select("id")
      .single();

    if (insertError) throw insertError;

    if (newTeam?.id) {
      await supabase
        .from("progress")
        .insert([{
          team_id: newTeam.id,
          current_level: 1,
          first_login_at: new Date().toISOString()
        }]);
    }
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Supabase unavailable, using offline fallback for registration.");

      const globalForDev = globalThis as unknown as { mockDevTeams?: any[]; mockDevProgress?: Record<string, any> };
      globalForDev.mockDevTeams = globalForDev.mockDevTeams || [];
      globalForDev.mockDevProgress = globalForDev.mockDevProgress || {};

      if (globalForDev.mockDevTeams.find((t: any) => t.ship_name.toLowerCase() === ship_name!.toLowerCase())) {
        return { success: false, errors: { ship_name: "That ship is already sailing these waters." } };
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password!, salt);
      const mockId = crypto.randomUUID();

      globalForDev.mockDevTeams.push({ id: mockId, ship_name, password_hash, member_names });
      globalForDev.mockDevProgress[mockId] = { current_level: 1, incorrect_count: 0, aid_tokens: 3 };
      
      return { success: true };
    } else {
      console.error("[registerTeam] Fatal error during registration:", e);
      return { success: false, errors: { general: "The Oracle rejected your registration. " + (e?.message || "Unknown error") } };
    }
  }

  return { success: true };
}
