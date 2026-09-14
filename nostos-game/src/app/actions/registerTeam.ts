"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export type RegisterState = {
  success: boolean;
  errors?: {
    ship_name?: string;
    password?: string;
    captain_name?: string;
    captain_phone?: string;
    member_names?: string;
    general?: string;
  };
};

export async function registerTeam(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const ship_name = formData.get("ship_name")?.toString().trim();
  const password = formData.get("password")?.toString();
  const captain_name = formData.get("captain_name")?.toString().trim();
  const captain_phone = formData.get("captain_phone")?.toString().trim();
  
  // Extract members starting with the Captain
  const member_names: string[] = [];
  if (captain_name) {
    member_names.push(captain_name);
  } else {
    const member_1 = formData.get("member_1")?.toString().trim();
    if (member_1) member_names.push(member_1);
  }

  for (let i = 2; i <= 4; i++) {
    const member = formData.get(`member_${i}`)?.toString().trim();
    if (member) member_names.push(member);
  }

  const errors: RegisterState["errors"] = {};

  if (!ship_name) errors.ship_name = "A ship must have a name.";
  if (!password || password.trim().length < 1) errors.password = "The password must be at least 1 character.";
  if (!captain_name) errors.captain_name = "The Captain must declare their full name.";
  
  if (!captain_phone) {
    errors.captain_phone = "The Captain must provide a phone number.";
  } else {
    let clean = captain_phone.replace(/[\s\-\(\)]/g, "");
    if (clean.startsWith("+91")) clean = clean.slice(3);
    else if (clean.startsWith("91") && clean.length === 12) clean = clean.slice(2);
    else if (clean.startsWith("0") && clean.length === 11) clean = clean.slice(1);

    const isValidIndianMobile = /^[6-9]\d{9}$/.test(clean);
    if (!isValidIndianMobile) {
      errors.captain_phone = "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210).";
    }
  }

  if (member_names.length < 2) errors.member_names = "A crew requires at least 2 members.";

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
    const { data: newTeam, error: insertError } = await supabase
      .from("teams")
      .insert([{ ship_name, password_hash, member_names, captain_name, captain_phone }])
      .select("id")
      .single();

    if (insertError) throw insertError;

    if (newTeam?.id) {
      // Auto-initialize progress record for the newly registered team
      await supabase
        .from("progress")
        .insert([{ 
          team_id: newTeam.id, 
          current_level: 1, 
          first_login_at: new Date().toISOString() 
        }]);
    }
  } catch (e) {
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
    globalForDev.mockDevTeams.push({
      id: mockId,
      ship_name,
      password_hash,
      member_names,
      captain_name,
      captain_phone
    });

    globalForDev.mockDevProgress[mockId] = {
      current_level: 1,
      incorrect_count: 0,
      aid_tokens: 3
    };
  }

  return { success: true };
}
