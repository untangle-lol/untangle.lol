import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = "/data/suggestions.json";
const MAX_PER_LANG = 500;
const GET_SAMPLE   = 30;
const VALID_LANGS = new Set(["en", "nl", "de", "fr", "es", "ar", "zh", "hi", "pt", "bn", "ru", "id", "ja", "sw", "tr"]);
const MAX_LEN = 120;

// In-memory fallback (used if /data is not mounted / not writable)
let mem = {};

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return mem;
  }
}

function save(store) {
  mem = store;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
  } catch {
    // /data not mounted — in-memory only, fine
  }
}

// GET /api/suggestions?lang=en
export async function GET(request) {
  const lang = new URL(request.url).searchParams.get("lang");
  if (!lang || !VALID_LANGS.has(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }
  const store = load();
  const all = store[lang] ?? [];
  // Return a random sample so clients see variety without receiving the full pool
  const sample = all.length <= GET_SAMPLE ? all : all
    .map(s => ({ s, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, GET_SAMPLE)
    .map(x => x.s);
  return NextResponse.json({ suggestions: sample });
}

// DELETE /api/suggestions  { lang, text }
export async function DELETE(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { lang, text } = body ?? {};

  if (!lang || !VALID_LANGS.has(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "missing text" }, { status: 400 });
  }

  const store = load();
  const list = store[lang] ?? [];
  store[lang] = list.filter((s) => s.trim().toLowerCase() !== text.trim().toLowerCase());
  save(store);

  return NextResponse.json({ ok: true });
}

// POST /api/suggestions  { lang, text }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { lang, text } = body ?? {};

  if (!lang || !VALID_LANGS.has(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "missing text" }, { status: 400 });
  }

  const clean = text.trim().slice(0, MAX_LEN);
  if (clean.length < 3) {
    return NextResponse.json({ error: "too short" }, { status: 400 });
  }

  const store = load();
  const list = store[lang] ?? [];

  // Dedupe case-insensitively, newest first, cap at MAX_PER_LANG
  const deduped = [clean, ...list.filter(
    (s) => s.toLowerCase() !== clean.toLowerCase()
  )].slice(0, MAX_PER_LANG);

  store[lang] = deduped;
  save(store);

  return NextResponse.json({ ok: true });
}
