"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession, setActiveSession, isUserCurrentlyLoggedIn, updateSessionHeartbeat, clearActiveSession, clearSession, getSession, isSessionActive } from "@/lib/session";
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
  console.log(`[auth.ts] loginTeam called with ship_name=${ship_name}, username=${username}`);
  
  try {
    const { data } = await supabase
      .from("teams")
      .select("id, password_hash, member_names")
      .ilike("ship_name", ship_name)
      .limit(1);

    if (data && data.length > 0) {
      team = data[0];
    }
  } catch (err) {
    console.warn("Supabase query error:", err);
  }

  // Fallback for dev mock teams if offline or not found in DB
  if (!team) {
    const globalForDev = globalThis as unknown as { mockDevTeams?: any[] };
    if (globalForDev.mockDevTeams) {
      team = globalForDev.mockDevTeams.find((t: any) => t.ship_name.toLowerCase() === ship_name.toLowerCase());
    }
  }

  if (!team) {
    console.log(`[auth.ts] Team not found for ship_name=${ship_name}`);
    return { success: false, error: "No such vessel is registered in our logs." };
  }
  
  console.log(`[auth.ts] Found team id=${team.id}`);

  const isMatch = await bcrypt.compare(password, team.password_hash);
  if (!isMatch) {
    return { success: false, error: "Incorrect password. The sea rejects you." };
  }

  // Validate crew member name against team.member_names
  const memberNames: string[] = team.member_names || [];
  const isValidMember = memberNames.length === 0 || memberNames.some(m => m.trim().toLowerCase() === username.toLowerCase());
  if (!isValidMember) {
    console.log(`[auth.ts] Invalid member ${username}. Member array:`, memberNames);
    return { 
      success: false, 
      error: `Sailor "${username}" is not a registered crew member of "${ship_name}".` 
    };
  }

  console.log(`[auth.ts] Valid member ${username}. Checking active sessions...`);

  await ensureDeviceToken();
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get("device_token")?.value;

  // We removed the active-session block here so users can seamlessly switch devices.
  // The new device will overwrite the session map, and the old device will be 
  // automatically kicked on its next heartbeat due to a session mismatch.

  // Generate unique session ID for single-device tracking
  const sessionId = crypto.randomUUID();
  setActiveSession(team.id, username, sessionId, deviceToken);

  // Create session
  await createSession({ role: "team", id: team.id, ship_name, username, sessionId });

  redirect("/play");
}

export async function sessionHeartbeat() {
  const session = await getSession();
  if (!session || !session.id || !session.username || !session.sessionId) {
    return { active: false };
  }

  const cookieStore = await cookies();
  const deviceToken = cookieStore.get("device_token")?.value;

  const active = updateSessionHeartbeat(session.id, session.username, session.sessionId, deviceToken);
  if (!active) {
    return { active: false };
  }

  let currentLevel: number | undefined;

  if (session.role === "team") {
    try {
      const { data } = await supabase
        .from("progress")
        .select("current_level")
        .eq("team_id", session.id)
        .maybeSingle();

      if (data) {
        currentLevel = data.current_level;
      }
    } catch (e) {
      // ignore offline errors
    }
  }

  return { active: true, currentLevel };
}

export async function logoutTeam() {
  const session = await getSession();
  if (session && session.id && session.username) {
    clearActiveSession(session.id, session.username);
  }
  await clearSession();
  redirect("/login");
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
      .select("id, password_hash, role")
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

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    return { success: false, error: "Invalid credentials." };
  }

  await createSession({ role: admin.role, id: admin.id, username });
  
  if (admin.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/volunteer");
  }
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

  const sessionId = crypto.randomUUID();
  await ensureDeviceToken();
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get("device_token")?.value;
  setActiveSession(teamId, "Dev Tester", sessionId, deviceToken);

  await createSession({ role: "team", id: teamId, ship_name: "Test Argo", username: "Dev Tester", sessionId });
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
