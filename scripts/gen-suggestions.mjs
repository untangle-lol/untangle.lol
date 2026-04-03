#!/usr/bin/env node
/**
 * Daily suggestion generator — runs via system cron
 * Calls Claude Haiku for all 15 languages, deduplicates, inserts into /data/untangle.db
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE  = path.join(__dirname, "../.env");
const CONTAINER = "untangle_web";
const LANGS     = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];

// ── env ───────────────────────────────────────────────────────────────────────
function loadEnv(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file, "utf8").split("\n")
        .filter(l => l.includes("=") && !l.startsWith("#"))
        .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
    );
  } catch { return {}; }
}

const env = loadEnv(ENV_FILE);
const API_KEY = env.ANTHROPIC_DEFAULT_KEY;
if (!API_KEY) { console.error("ANTHROPIC_DEFAULT_KEY not found in .env"); process.exit(1); }

// ── insert into DB via docker exec ────────────────────────────────────────────
// Write a helper script into the container once, then pipe JSON to it via stdin.
const INSERT_SCRIPT = `
const Database = require('/app/node_modules/better-sqlite3');
const db = new Database('/data/untangle.db');
let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  const data = JSON.parse(raw);
  const stmt = db.prepare('INSERT OR IGNORE INTO suggestions (lang, text) VALUES (?, ?)');
  const insert = db.transaction((lang, items) => {
    let n = 0;
    for (const t of items) { const r = stmt.run(lang, t); if (r.changes) n++; }
    return n;
  });
  const stats = [];
  for (const [lang, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    const n = insert(lang, items.filter(t => typeof t === 'string' && t.trim().length >= 5).map(t => t.trim()));
    stats.push(lang + ':+' + n);
  }
  console.log(stats.join('  '));
});
`.trim();

function insertIntoDb(generated) {
  // Upload script (idempotent — same content every run)
  execSync(`docker exec -i ${CONTAINER} sh -c 'cat > /tmp/sg_insert.js'`, { input: INSERT_SCRIPT });
  // Pipe JSON to the script
  return execSync(`docker exec -i ${CONTAINER} node /tmp/sg_insert.js`, {
    input: JSON.stringify(generated),
    encoding: "utf8",
  }).trim();
}

// ── prompt ────────────────────────────────────────────────────────────────────
const BATCHES = [
  ["nl","en","de","fr","es","pt","ar","bn"],
  ["hi","id","ja","ru","sw","tr","zh"],
];

function makePrompt(langs) {
  const keys = langs.map(l => `"${l}":["..."]`).join(",");
  return `Generate exactly 20 goal suggestions per language. First person singular. Mix these categories across the 20 suggestions:
- 6 altruistic (helping others, volunteering, community, charity, caregiving)
- 5 personal growth / health / wellbeing
- 3 career / finance
- 3 funny or meme-able (absurd, self-aware, internet-culture flavoured — but still framed as a real goal)
- 3 creativity / relationships

Use natural, colloquial phrasing for each language. The funny ones should feel like something a real person would type, not a joke setup.

Return only valid JSON, no markdown, no explanation:
{${keys}}

Each suggestion: first person, 5–15 words, specific and actionable.
nl funny example: "Ik wil stoppen met dingen uitstellen door dit later te doen"
en funny example: "I want to become a morning person starting next Monday"
nl altruistic example: "Ik wil elke week boodschappen doen voor een oudere buur"
en altruistic example: "I want to teach my neighbor how to use a smartphone"`;
}

// ── API call ──────────────────────────────────────────────────────────────────
async function callApi(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content[0].text.trim().replace(/^```json\s?|```$/g, "");
  const usage = data.usage;
  console.log(`  tokens: in=${usage?.input_tokens} out=${usage?.output_tokens} stop=${data.stop_reason}`);
  if (data.stop_reason === "max_tokens") throw new Error("Response truncated — increase max_tokens");
  return JSON.parse(text);
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Generating suggestions for ${LANGS.length} languages...`);

  const generated = {};
  for (const batch of BATCHES) {
    try {
      const partial = await callApi(makePrompt(batch));
      Object.assign(generated, partial);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Batch ${batch.join(",")} failed:`, e.message);
      process.exit(1);
    }
  }

  const stats = insertIntoDb(generated);
  console.log(`[${new Date().toISOString()}] Done. ${stats}`);
}

main().catch(e => { console.error(e); process.exit(1); });
