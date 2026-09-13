"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession, setActiveSession, isUserCurrentlyLoggedIn } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type LoginState = {
  success: boolean;
  error?: string;
};

// Ensure a device token exists
async function ensureDeviceToken() {
  const cookieStore = await cookies();
  if (!cookieStore.has("device_token")) {
    const token = crypto.randomUUID();
    cookieStore.set("device_token", token, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}

export async function loginTeam(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username")?.toString().trim();
  const ship_name = formData.get("ship_name")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username || !ship_name || !password) {
    return { success: false, error: "Username, ship name, and password are required." };
  }

  let team: any = null;
  
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("id, password_hash, member_names")
      .ilike("ship_name", ship_name)
      .maybeSingle();

    if (error) {
      console.error(error);
      return { success: false, error: "The Oracle is silent. Try again." };
    }
    team = data;
  } catch (err) {
    console.warn("Supabase connection failed, checking offline mock teams:", err);
    
    const globalForDev = globalThis as unknown as { mockDevTeams?: any[] };
    if (globalForDev.mockDevTeams) {
      team = globalForDev.mockDevTeams.find((t: any) => t.ship_name.toLowerCase() === ship_name.toLowerCase());
    }

    if (!team) {
      return { success: false, error: "The Oracle is offline and this vessel is not in local memory." };
    }
  }

  if (!team) {
    return { success: false, error: "No such vessel is registered in our logs." };
  }

  const isMatch = await bcrypt.compare(password, team.password_hash);
  if (!isMatch) {
    return { success: false, error: "Incorrect password. The sea rejects you." };
  }

  // Validate crew member name against team.member_names
  const memberNames: string[] = team.member_names || [];
  const isValidMember = memberNames.length === 0 || memberNames.some(m => m.trim().toLowerCase() === username.toLowerCase());
  if (!isValidMember) {
    return { 
      success: false, 
      error: `Sailor "${username}" is not a registered crew member of "${ship_name}".` 
    };
  }

  await ensureDeviceToken();
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get("device_token")?.value;

  // Check if sailor is already logged in on another device or window
  if (isUserCurrentlyLoggedIn(team.id, username, deviceToken)) {
    return {
      success: false,
      error: `Sailor "${username}" is already active on another device or tab. Log out on that device to proceed.`
    };
  }

  // Generate unique session ID for single-device tracking
  const sessionId = crypto.randomUUID();
  setActiveSession(team.id, username, sessionId, deviceToken);

  // Create session
  await createSession({ role: "team", id: team.id, ship_name, username, sessionId });

  redirect("/play");
}

export async function loginAdmin(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { success: false, error: "Username and password are required." };
  }

  let admin: any = null;
  
  try {
    const { data, error } = await supabase
      .from("admins")
      .select("id, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "Invalid credentials." };
    }
    admin = data;
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return { success: false, error: "The Oracle is offline. Please try again later." };
  }

  // Assuming admins are seeded, you would bcrypt.compare here. 
  // For safety in this environment without a seeded admin password, 
  // we still attempt a bcrypt compare.
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    return { success: false, error: "Invalid credentials." };
  }

  await createSession({ role: "admin", id: admin.id, username });
  redirect("/admin");
}

// Development quick-login endpoints
export async function quickLoginTestTeam() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Not allowed in production");
  }

  let teamId = "dev-test-argo-id";

  try {
    let { data: team, error } = await supabase
      .from("teams")
      .select("id, password_hash")
      .eq("ship_name", "Test Argo")
      .maybeSingle();

    if (!team && !error) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash("testpassword", salt);
      const { data: newTeam } = await supabase
        .from("teams")
        .insert([{ ship_name: "Test Argo", password_hash, member_names: ["Tester 1", "Tester 2", "Tester 3"] }])
        .select("id, password_hash")
        .single();
      team = newTeam;
    }

    if (team?.id) {
      teamId = team.id;
    }
  } catch (err) {
    console.warn("Supabase local/remote connection unavailable, using fallback dev session for Test Argo:", err);
  }

  await createSession({ role: "team", id: teamId, ship_name: "Test Argo", username: "Dev Tester" });
  await ensureDeviceToken();
  redirect("/play");
}

export async function quickLoginAdmin() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Not allowed in production");
  }

  let adminId = "dev-test-admin-id";

  try {
    let { data: admin, error } = await supabase
      .from("admins")
      .select("id")
      .eq("username", "testadmin")
      .maybeSingle();

    if (!admin && !error) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash("adminpass", salt);
      const { data: newAdmin } = await supabase
        .from("admins")
        .insert([{ username: "testadmin", password_hash, role: "admin" }])
        .select("id")
        .single();
      admin = newAdmin;
    }

    if (admin?.id) {
      adminId = admin.id;
    }
  } catch (err) {
    console.warn("Supabase local/remote connection unavailable, using fallback dev session for Admin:", err);
  }

  await createSession({ role: "admin", id: adminId, username: "testadmin" });
  redirect("/admin");
}
