"use server";

import { getSession, isSessionActive } from "@/lib/session";

export async function getTeamId() {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return null;
  }
  if (session.id && session.username && session.sessionId && !isSessionActive(session.id, session.username, session.sessionId)) {
    return null;
  }
  return session.id;
}
