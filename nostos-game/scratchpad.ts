import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data } = await supabase.from("teams").select("id, ship_name, member_names").limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
