"use server";

import { getSession } from "@/lib/session";

export async function getTeamId() {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return null;
  }
  return session.id;
}
