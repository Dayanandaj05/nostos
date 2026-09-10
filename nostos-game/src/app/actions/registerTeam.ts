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
  
  // Extract members
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
    // Check if ship name is already taken
    const { data: existingTeam, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .ilike("ship_name", ship_name!)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingTeam) {
      return { success: false, errors: { ship_name: "That ship is already sailing these waters." } };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password!, salt);

    // Insert team
    const { error: insertError } = await supabase
      .from("teams")
      .insert([{ ship_name, password_hash, member_names }]);

    if (insertError) throw insertError;
  } catch (e) {
    console.warn("Supabase unavailable, using offline fallback for registration.");
    
    const globalForDev = globalThis as unknown as { mockDevTeams?: any[] };
    globalForDev.mockDevTeams = globalForDev.mockDevTeams || [];
    
    if (globalForDev.mockDevTeams.find((t: any) => t.ship_name.toLowerCase() === ship_name!.toLowerCase())) {
      return { success: false, errors: { ship_name: "That ship is already sailing these waters." } };
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password!, salt);
    
    globalForDev.mockDevTeams.push({
      id: crypto.randomUUID(),
      ship_name,
      password_hash,
      member_names
    });
  }

  return { success: true };
}
