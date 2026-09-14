import React from "react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { VolunteerClient } from "./VolunteerClient";

export default async function VolunteerPage() {
  const session = await getSession();
  
  if (!session || (session.role !== "admin" && session.role !== "volunteer")) {
    redirect("/");
  }

  // Fetch teams progress
  const { data: teams } = await supabase
    .from("progress")
    .select("*, teams(ship_name, captain_name, captain_phone)")
    .order("current_level", { ascending: false });

  return (
    <VolunteerClient 
      teams={teams || []} 
      currentUsername={session.username} 
    />
  );
}
