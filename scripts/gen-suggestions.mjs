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

const LANG_EXAMPLES = {
  nl: `"Ik wil stoppen met dingen uitstellen — begin ik morgen wel mee", "Ik wil elke week boodschappen doen voor de buurvrouw", "Ik wil eindelijk leren hoe ik een belastingaangifte invul"`,
  en: `"I want to finally use my gym membership instead of paying for guilt", "I want to teach my elderly neighbor how to video call their grandkids", "I want to spend less time doomscrolling and more time outside"`,
  de: `"Ich möchte endlich meinen Keller ausmisten und nicht mehr vertagen", "Ich möchte älteren Menschen in meiner Nachbarschaft beim Einkaufen helfen", "Ich möchte weniger Zeit mit dem Handy verbringen"`,
  fr: `"Je veux arrêter de remettre à demain ce que je peux faire après-demain", "Je veux aider les personnes âgées de mon quartier avec leurs courses", "Je veux enfin apprendre à cuisiner autre chose que des pâtes"`,
  es: `"Quiero dejar de procrastinar, empezando mañana sin falta", "Quiero hacer la compra para los vecinos mayores de mi barrio", "Quiero aprender a decir que no sin sentirme culpable"`,
  pt: `"Quero parar de procrastinar, começo amanhã com certeza", "Quero ajudar os idosos da minha rua com as compras", "Quero aprender a cozinhar algo além de arroz e feijão"`,
  ar: `"أريد التوقف عن تأجيل الأمور، سأبدأ غداً بالتأكيد", "أريد مساعدة كبار السن في حيّي على التسوق", "أريد تعلم كيفية إدارة ميزانيتي الشهرية"`,
  bn: `"আমি আর দেরি না করে আজ থেকেই শুরু করতে চাই", "আমি আমার পাড়ার বয়স্কদের সাহায্য করতে চাই", "আমি প্রতিদিন একটু হলেও বাংলা সাহিত্য পড়তে চাই"`,
  hi: `"मैं कल से नहीं, आज से ही बदलाव शुरू करना चाहता हूं", "मैं अपने मोहल्ले के बुजुर्गों की मदद करना चाहता हूं", "मैं सोशल मीडिया कम देखना और किताबें ज़्यादा पढ़ना चाहता हूं"`,
  id: `"Saya ingin berhenti menunda-nunda, mulai besok pagi", "Saya ingin membantu tetangga lansia berbelanja setiap minggu", "Saya ingin lebih sering memasak sendiri daripada pesan online"`,
  ja: `"先延ばしをやめて、今日から少しずつ始めたい", "近所のお年寄りの買い物を手伝いたい", "スマホを見る時間を減らして、本をもっと読みたい"`,
  ru: `"Я хочу перестать откладывать дела на потом — начну завтра, точно", "Я хочу помогать пожилым соседям с покупками", "Я хочу научиться готовить что-то кроме яичницы"`,
  sw: `"Nataka kuacha kuahirisha kazi, nitaanza kesho bila shaka", "Nataka kusaidia wazee wa mtaa wangu kufanya manunuzi", "Nataka kujifunza kupika vyakula vipya"`,
  tr: `"Erteleme alışkanlığımı bırakmak istiyorum, yarın kesinlikle başlayacağım", "Mahallemdeki yaşlılara alışveriş konusunda yardım etmek istiyorum", "Telefonu daha az kullanıp daha fazla kitap okumak istiyorum"`,
  zh: `"我想停止拖延，明天一定开始", "我想每周帮助社区里的老人买菜", "我想少刷手机，多读书"`,
};

function makePrompt(langs) {
  const keys = langs.map(l => `"${l}":["..."]`).join(",");
  const exampleBlock = langs
    .filter(l => LANG_EXAMPLES[l])
    .map(l => `${l}: ${LANG_EXAMPLES[l]}`)
    .join("\n");

  return `Generate exactly 20 goal suggestions per language. Each suggestion must feel like it was written by a native speaker of that language — do NOT translate from English or any other language. Write directly in each language as a native would naturally express themselves.

Mix these categories across the 20 suggestions per language:
- 6 altruistic (helping others, volunteering, community, caregiving — rooted in local culture)
- 5 personal growth / health / wellbeing
- 3 career / finance
- 3 funny or self-aware (relatable, a little absurd, internet-generation humour — native feel)
- 3 creativity / relationships

Rules:
- First person singular
- 5–15 words per suggestion
- Specific and actionable
- Culturally grounded — reference things real people in that culture actually do or think about
- The funny ones must land in that language, not feel like a translated joke

Native-feel examples per language (use as tone reference only, do not copy):
${exampleBlock}

Return only valid JSON, no markdown, no explanation:
{${keys}}`;
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
