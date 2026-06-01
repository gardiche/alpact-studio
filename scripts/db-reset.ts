/**
 * Reset complet de la DB : drop le schema public puis re-pousse + re-seed.
 *
 * Usage : npx tsx scripts/db-reset.ts
 *
 * ⚠️ DESTRUCTIF — utilise uniquement sur le projet Supabase de dev.
 */
import { config } from "dotenv";
import postgres from "postgres";
import { execSync } from "node:child_process";

config({ path: ".env.local" });

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error("❌ SUPABASE_DB_URL manquant");
  process.exit(1);
}

async function dropAll() {
  console.log("🧨 Drop du schema public...");
  const sql = postgres(DB_URL!, { prepare: false });
  try {
    await sql.unsafe(`
      drop schema if exists public cascade;
      create schema public;
      grant usage on schema public to anon, authenticated, service_role;
      grant create on schema public to service_role;
    `);
    // Drop tous les users (sauf service)
    const users = await sql.unsafe(`select id, email from auth.users`);
    for (const u of users as Array<{ id: string; email: string }>) {
      console.log(`   🗑️  drop user ${u.email}`);
    }
  } finally {
    await sql.end();
  }
  console.log("✅ Schema droppé\n");
}

async function deleteAllAuthUsers() {
  // On utilise le client admin pour bien drop via API (cascade ok)
  const { createClient } = await import("@supabase/supabase-js");
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Supabase URL/key manquants");
    return;
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase.auth.admin.listUsers();
  for (const u of data?.users ?? []) {
    await supabase.auth.admin.deleteUser(u.id);
    console.log(`   🗑️  user auth supprimé : ${u.email}`);
  }
}

async function main() {
  console.log("⚠️  RESET COMPLET DE LA DB Alpact Studio\n");
  await deleteAllAuthUsers();
  await dropAll();
  console.log("▶️  Re-push des migrations...\n");
  execSync("npx tsx scripts/db-push.ts", { stdio: "inherit" });
  console.log("\n▶️  Re-seed des comptes démo...\n");
  execSync("npx tsx scripts/db-seed.ts", { stdio: "inherit" });
  console.log("\n✨ Reset terminé.");
}

main().catch((e) => {
  console.error("❌", e);
  process.exitCode = 1;
});
