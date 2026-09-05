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
  if (!password || password.length < 6) errors.password = "The password must be at least 6 characters.";
  if (member_names.length < 3) errors.member_names = "A crew requires at least 3 members.";

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Check if ship name is already taken
  const { data: existingTeam, error: checkError } = await supabase
    .from("teams")
    .select("id")
    .ilike("ship_name", ship_name!)
    .maybeSingle();

  if (checkError) {
    console.error(checkError);
    return { success: false, errors: { general: "The oracle is silent. Try again." } };
  }

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

  if (insertError) {
    console.error(insertError);
    return { success: false, errors: { general: "Failed to record your vessel in the logs." } };
  }

  return { success: true };
}
