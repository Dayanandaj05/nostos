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

// Global store for single device session tracking per crew member
const getActiveSessionsMap = () => {
  const g = globalThis as unknown as { activeSessions?: Map<string, string> };
  if (!g.activeSessions) {
    g.activeSessions = new Map<string, string>();
  }
  return g.activeSessions;
};

export function setActiveSession(teamId: string, username: string, sessionId: string) {
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  getActiveSessionsMap().set(key, sessionId);
}

export function isSessionActive(teamId: string, username: string, sessionId?: string): boolean {
  if (!sessionId) return true;
  const key = `${teamId}:${username.trim().toLowerCase()}`;
  const currentActiveSessionId = getActiveSessionsMap().get(key);
  // If no active session tracked yet, allow it. If tracked, must match.
  if (!currentActiveSessionId) return true;
  return currentActiveSessionId === sessionId;
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

