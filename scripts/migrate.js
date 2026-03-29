#!/usr/bin/env node
/**
 * migrate.js — Applique toutes les migrations Supabase sans CLI
 *
 * Usage:
 *   node scripts/migrate.js --token YOUR_TOKEN
 *
 * Obtenir le token :
 *   https://supabase.com/dashboard/account/tokens → "Generate new token"
 *
 * Le script :
 *   - Crée une table `_migrations` si elle n'existe pas
 *   - Applique chaque fichier SQL dans l'ordre (000, 001, ...)
 *   - Saute les migrations déjà appliquées (idempotent)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// ── Config ───────────────────────────────────────────────────────
const PROJECT_REF = "msyitskhrbadjuxyjydu";
const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

// Parse args
const tokenIdx = process.argv.indexOf("--token");
const ACCESS_TOKEN = tokenIdx !== -1 ? process.argv[tokenIdx + 1] : process.env.SUPABASE_ACCESS_TOKEN;

// --from 015_push_notifications.sql → marque toutes les migrations AVANT ce fichier
// comme déjà appliquées sans les rejouer
const fromIdx = process.argv.indexOf("--from");
const FROM_FILE = fromIdx !== -1 ? process.argv[fromIdx + 1] : null;

if (!ACCESS_TOKEN) {
  console.error("❌  Token manquant.");
  console.error("   Usage : node scripts/migrate.js --token TON_TOKEN [--from FICHIER.sql]");
  console.error("   Token : https://supabase.com/dashboard/account/tokens");
  console.error("");
  console.error("   --from : marque toutes les migrations AVANT ce fichier comme déjà");
  console.error("            appliquées sans les exécuter (utile si la DB existait déjà)");
  console.error("   Exemple: node scripts/migrate.js --token xxx --from 015_push_notifications.sql");
  process.exit(1);
}

// ── API helper ───────────────────────────────────────────────────
function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || parsed.error || data));
          } else {
            resolve(parsed);
          }
        } catch {
          if (res.statusCode >= 400) reject(new Error(data));
          else resolve(data);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Init migrations tracking table ──────────────────────────────
async function initMigrationsTable() {
  await runSQL(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

// ── Get already-applied migrations ───────────────────────────────
async function getApplied() {
  const rows = await runSQL("SELECT filename FROM _migrations ORDER BY filename;");
  return new Set((rows || []).map((r) => r.filename));
}

// ── Mark migration as applied ────────────────────────────────────
async function markApplied(filename) {
  await runSQL(
    `INSERT INTO _migrations (filename) VALUES ('${filename}') ON CONFLICT DO NOTHING;`
  );
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔌  Connexion à ${PROJECT_REF}.supabase.co`);

  // Init tracking table
  await initMigrationsTable();
  const applied = await getApplied();

  // Read migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("⚠️   Aucun fichier .sql trouvé dans supabase/migrations/");
    return;
  }

  console.log(`\n📂  ${files.length} migration(s) trouvée(s)\n`);

  let newCount = 0;
  let skipCount = 0;
  let markedCount = 0;

  for (const file of files) {
    // Already tracked in DB
    if (applied.has(file)) {
      console.log(`  ⏭️   ${file} — déjà appliquée`);
      skipCount++;
      continue;
    }

    // --from mode: mark files before the target as applied without running
    if (FROM_FILE && file < FROM_FILE) {
      await markApplied(file);
      console.log(`  📌  ${file} — marquée (existante)`);
      markedCount++;
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

    process.stdout.write(`  ⏳  ${file} ... `);
    try {
      await runSQL(sql);
      await markApplied(file);
      console.log("✅");
      newCount++;
    } catch (err) {
      console.log("❌");
      console.error(`\n     Erreur : ${err.message}\n`);
      console.error("     ↳ Corrige cette migration puis relance le script.");
      process.exit(1);
    }
  }

  console.log(`\n${newCount > 0 ? "✅" : "👌"}  ${newCount} nouvelle(s), ${markedCount} marquée(s), ${skipCount} ignorée(s)\n`);
}

main().catch((err) => {
  console.error("Erreur inattendue :", err.message);
  process.exit(1);
});
