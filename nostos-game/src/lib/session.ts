import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET || "super-secret-jwt-token-with-at-least-32-characters-long";
const key = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  role: "team" | "admin" | "volunteer";
  id: string; // team_id or admin_id
  ship_name?: string;
  username?: string;
  sessionId?: string;
};

export type ActiveSessionData = {
  sessionId: string;
  deviceToken?: string;
  lastActiveAt: number;
};

// Global store for single device session tracking per crew member
const getActiveSessionsMap = () => {
  const g = globalThis as unknown as { activeSessions?: Map<string, ActiveSessionData> };
  if (!g.activeSessions) {
    g.activeSessions = new Map<string, ActiveSessionData>();
  }
  return g.activeSessions;
};

export function setActiveSession(teamId: string, username: string, sessionId: string, deviceToken?: string) {
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  getActiveSessionsMap().set(key, {
    sessionId,
    deviceToken,
    lastActiveAt: Date.now()
  });
}

export function isUserCurrentlyLoggedIn(teamId: string, username: string, currentDeviceToken?: string): boolean {
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  const existing = getActiveSessionsMap().get(key);
  if (!existing) return false;

  // Active session expires after 2 minutes of total inactivity (no heartbeats)
  const isRecent = Date.now() - existing.lastActiveAt < 2 * 60 * 1000;
  if (!isRecent) return false;

  // If existing session has no recorded deviceToken, or matches current deviceToken, allow re-login on same device
  if (!existing.deviceToken || (currentDeviceToken && existing.deviceToken === currentDeviceToken)) {
    return false;
  }

  return true;
}

export function updateSessionHeartbeat(teamId: string, username: string, sessionId?: string, deviceToken?: string): boolean {
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  const existing = getActiveSessionsMap().get(key);
  
  if (existing) {
    if (sessionId && existing.sessionId !== sessionId) {
      return false; // Actually a different session trying to heartbeat
    }
    existing.lastActiveAt = Date.now();
    if (deviceToken) existing.deviceToken = deviceToken;
    return true;
  }
  
  // VERCEL SERVERLESS FIX: If the global Map is empty (e.g. cold start),
  // we must re-initialize the session in memory instead of rejecting it!
  if (sessionId) {
    setActiveSession(teamId, username, sessionId, deviceToken);
    return true;
  }

  return false;
}

export function clearActiveSession(teamId: string, username: string) {
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  getActiveSessionsMap().delete(key);
}

export function isSessionActive(teamId: string, username: string, sessionId?: string): boolean {
  if (!sessionId) return false;
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  const existing = getActiveSessionsMap().get(key);
  
  // VERCEL SERVERLESS FIX: If the global Map is empty (e.g. cold start on a different lambda),
  // we must assume the session is valid to prevent instantly logging the user out right after login.
  if (!existing) return true; 
  
  // Must match session ID and be within inactivity threshold (2 mins)
  const isRecent = Date.now() - existing.lastActiveAt < 2 * 60 * 1000;
  return existing.sessionId === sessionId && isRecent;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // 24 hours
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set("nostos_session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nostos_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set("nostos_session", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

