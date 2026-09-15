"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function checkGodMessages() {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { success: false, messages: [] };
  }

  const { data, error } = await supabase
    .from("god_messages")
    .select("id, message, created_at")
    .eq("team_id", session.id)
    .eq("is_read", false)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, messages: [] };
  }

  return { success: true, messages: data || [] };
}

export async function markGodMessageRead(messageId: string) {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { success: false };
  }

  const { error } = await supabase
    .from("god_messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("team_id", session.id); // Ensure they can only mark their own as read

  return { success: !error };
}
