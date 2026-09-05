import React from "react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Fetch all necessary data
  const { data: teams } = await supabase
    .from("progress")
    .select("*, teams(ship_name)")
    .order("current_level", { ascending: false });

  const { data: levels } = await supabase
    .from("levels")
    .select("id, level_number, is_locked")
    .order("level_number", { ascending: true });

  const { data: logs } = await supabase
    .from("incident_logs")
    .select("*, teams(ship_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AdminClient 
      teams={teams || []} 
      levels={levels || []} 
      logs={logs || []} 
      currentUsername={session.username} 
    />
  );
}
