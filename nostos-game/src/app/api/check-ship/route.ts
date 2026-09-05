import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ship = searchParams.get("ship");

  if (!ship || ship.trim().length === 0) {
    return NextResponse.json({ taken: false });
  }

  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .ilike("ship_name", ship.trim())
    .maybeSingle();

  if (error) {
    console.error("Error checking ship name:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }

  return NextResponse.json({ taken: !!data });
}
