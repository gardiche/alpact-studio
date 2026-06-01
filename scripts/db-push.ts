/**
 * Push des migrations SQL vers Supabase.
 *
 * Usage : npx tsx scripts/db-push.ts
 *
 * Requiert : SUPABASE_DB_URL dans .env.local
 *   format : postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
 *   À récupérer dans Supabase Dashboard → Settings → Database → Connection string → "Transaction"
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error("❌ SUPABASE_DB_URL manquant dans .env.local");
  console.error("Récupère-le dans Supabase Dashboard → Settings → Database → Connection string (Transaction)");
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`🚀 ${files.length} migration(s) à pousser :\n`);
  files.forEach((f) => console.log(`   - ${f}`));
  console.log();

  const sql = postgres(DB_URL!, {
    prepare: false,
    onnotice: (notice) => {
      if (notice.severity === "NOTICE") return; // Silence les "table exists"
      console.log(`   ℹ️  ${notice.message}`);
    },
  });

  try {
    for (const file of files) {
      const path = join(MIGRATIONS_DIR, file);
      const content = readFileSync(path, "utf-8");
      console.log(`▶️  ${file}`);
      await sql.unsafe(content);
      console.log(`✅ ${file} OK\n`);
    }
    console.log("✨ Toutes les migrations ont été appliquées avec succès.");
  } catch (err) {
    console.error("❌ Erreur lors de la migration :", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
