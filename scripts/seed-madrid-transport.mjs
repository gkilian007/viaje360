import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { getMadridTransportSeedRows, MADRID_TRANSPORT_SEED_KEY, MADRID_TRANSPORT_SOURCE_KIND } from "../src/lib/madrid-transport.ts";

for (const envPath of [".env.local", ".env"]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Supabase no está configurado para el seed de transporte Madrid.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const rows = getMadridTransportSeedRows();

const { data: existing, error: existingError } = await supabase
  .from("activity_knowledge")
  .select("normalized_name,category,source_kind")
  .eq("destination", "Madrid")
  .eq("source_kind", MADRID_TRANSPORT_SOURCE_KIND);

if (existingError) throw existingError;

const seen = new Set((existing || []).map((row) => `${row.normalized_name || ""}::${row.category || ""}`));
const freshRows = rows.filter((row) => !seen.has(`${row.normalized_name}::${row.category}`));

if (freshRows.length > 0) {
  const { error: insertError } = await supabase.from("activity_knowledge").insert(freshRows);
  if (insertError) throw insertError;
}

console.log(JSON.stringify({ inserted: freshRows.length, totalSeedRows: rows.length, seedKey: MADRID_TRANSPORT_SEED_KEY }, null, 2));
