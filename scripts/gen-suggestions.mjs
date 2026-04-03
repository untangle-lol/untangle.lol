#!/usr/bin/env node
/**
 * Daily suggestion generator — runs via system cron
 * Calls Claude Haiku once for all 15 languages, deduplicates, writes to /data/suggestions.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE   = path.join(__dirname, "../.env");
const DATA_FILE    = "/data/suggestions.json";
const CONTAINER    = "untangle_web";
const MAX_PER_LANG = 500;
const LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];

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

// ── data helpers ──────────────────────────────────────────────────────────────
function load() {
  try {
    const raw = execSync(`docker exec ${CONTAINER} cat ${DATA_FILE} 2>/dev/null || echo '{}'`).toString();
    return JSON.parse(raw);
  } catch { return {}; }
}
function save(store) {
  const json = JSON.stringify(store);
  execSync(`docker exec -i ${CONTAINER} sh -c 'cat > ${DATA_FILE}'`, { input: json });
}

// ── prompt ────────────────────────────────────────────────────────────────────
const BATCHES = [
  ["nl","en","de","fr","es","pt","ar","bn"],
  ["hi","id","ja","ru","sw","tr","zh"],
];

function makePrompt(langs) {
  const keys = langs.map(l => `"${l}":["..."]`).join(",");
  return `Generate exactly 20 goal suggestions per language. First person singular. Evenly mix these categories: health, career, relationships, finance, creativity, personal growth, altruistic (helping others). Use natural phrasing for each language.

Return only valid JSON, no markdown, no explanation:
{${keys}}

Each suggestion: first person, 5–15 words, specific and actionable.
nl example: "Ik wil elke ochtend 30 minuten wandelen"
en example: "I want to read one book every month"
ja example: "毎朝30分散歩したい"`;
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
      max_tokens: 4000,
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

async function generate() {
  const results = {};
  for (const batch of BATCHES) {
    const partial = await callApi(makePrompt(batch));
    Object.assign(results, partial);
  }
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Generating suggestions for ${LANGS.length} languages...`);

  let generated;
  try {
    generated = await generate();
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Generation failed:`, e.message);
    process.exit(1);
  }

  const store = load();
  const stats = [];

  for (const lang of LANGS) {
    const existing = store[lang] ?? [];
    const existingSet = new Set(existing.map(s => s.toLowerCase()));
    const newOnes = (generated[lang] ?? [])
      .map(s => s.trim())
      .filter(s => s.length >= 5 && !existingSet.has(s.toLowerCase()));
    // Prepend new, keep newest-first, cap at MAX_PER_LANG
    store[lang] = [...newOnes, ...existing].slice(0, MAX_PER_LANG);
    stats.push(`${lang}:+${newOnes.length}`);
  }

  save(store);
  console.log(`[${new Date().toISOString()}] Done. ${stats.join("  ")}`);
}

main().catch(e => { console.error(e); process.exit(1); });
