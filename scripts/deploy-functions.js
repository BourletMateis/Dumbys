#!/usr/bin/env node
/**
 * deploy-functions.js — Déploie les Edge Functions Supabase sans CLI
 *
 * Usage:
 *   node scripts/deploy-functions.js --token YOUR_TOKEN
 *
 * Déploie toutes les fonctions dans supabase/functions/ (chaque sous-dossier
 * avec un index.ts est une fonction).
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const PROJECT_REF    = "msyitskhrbadjuxyjydu";
const FUNCTIONS_DIR  = path.join(__dirname, "..", "supabase", "functions");

// Secrets à injecter dans toutes les fonctions
const SECRETS = {
  EXPO_ACCESS_TOKEN: "DepHr0a6HUcQM5cG7j8DxgTKLNgJOAgw9XIK8h3q",
};

const tokenIdx   = process.argv.indexOf("--token");
const ACCESS_TOKEN = tokenIdx !== -1 ? process.argv[tokenIdx + 1] : process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌  Token manquant.");
  console.error("   Usage : node scripts/deploy-functions.js --token TON_TOKEN");
  process.exit(1);
}

// ── API helper ───────────────────────────────────────────────────
function apiRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "api.supabase.com",
      path: apiPath,
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || parsed.error || JSON.stringify(parsed)));
          } else {
            resolve({ status: res.statusCode, body: parsed });
          }
        } catch {
          if (res.statusCode >= 400) reject(new Error(data));
          else resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Get existing functions ───────────────────────────────────────
async function getExistingFunctions() {
  const { body } = await apiRequest("GET", `/v1/projects/${PROJECT_REF}/functions`);
  return new Set((body || []).map((f) => f.slug));
}

// ── Deploy one function ──────────────────────────────────────────
async function deployFunction(slug, source) {
  const existing = await getExistingFunctions();
  const payload = {
    slug,
    name: slug,
    body: source,
    verify_jwt: true,
  };

  if (existing.has(slug)) {
    // Update
    await apiRequest("PATCH", `/v1/projects/${PROJECT_REF}/functions/${slug}`, payload);
  } else {
    // Create
    await apiRequest("POST", `/v1/projects/${PROJECT_REF}/functions`, payload);
  }
}

// ── Set project secrets ──────────────────────────────────────────
async function setSecrets() {
  const payload = Object.entries(SECRETS).map(([name, value]) => ({ name, value }));
  await apiRequest("POST", `/v1/projects/${PROJECT_REF}/secrets`, payload);
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔌  Déploiement vers ${PROJECT_REF}.supabase.co\n`);

  // Set secrets first
  process.stdout.write(`  🔑  Configuration des secrets ... `);
  try {
    await setSecrets();
    console.log("✅");
  } catch (err) {
    console.log("❌");
    console.error(`\n     Erreur secrets : ${err.message}\n`);
  }
  console.log();

  const entries = fs.readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (entries.length === 0) {
    console.log("⚠️   Aucune fonction trouvée dans supabase/functions/");
    return;
  }

  console.log(`📂  ${entries.length} fonction(s) trouvée(s)\n`);

  for (const name of entries) {
    const indexPath = path.join(FUNCTIONS_DIR, name, "index.ts");
    if (!fs.existsSync(indexPath)) {
      console.log(`  ⏭️   ${name} — pas de index.ts, ignorée`);
      continue;
    }

    const source = fs.readFileSync(indexPath, "utf8");
    process.stdout.write(`  ⏳  ${name} ... `);
    try {
      await deployFunction(name, source);
      console.log("✅");
    } catch (err) {
      console.log("❌");
      console.error(`\n     Erreur : ${err.message}\n`);
    }
  }

  console.log("\n✅  Déploiement terminé\n");
}

main().catch((err) => {
  console.error("Erreur inattendue :", err.message);
  process.exit(1);
});
