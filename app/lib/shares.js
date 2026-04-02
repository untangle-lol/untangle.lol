import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_FILE = "/data/shares.json";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// In-memory fallback (used if /data is not mounted / not writable)
let mem = {};

function loadShares() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return mem;
  }
}

function saveShares(store) {
  mem = store;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
  } catch {
    // /data not mounted — in-memory only, fine
  }
}

function pruneShares(store) {
  const now = Date.now();
  const pruned = {};
  for (const [id, entry] of Object.entries(store)) {
    if (now - entry.createdAt < TTL_MS) {
      pruned[id] = entry;
    }
  }
  return pruned;
}

export function getShare(id) {
  const store = loadShares();
  const entry = store[id];
  if (!entry) return null;
  if (Date.now() - entry.createdAt >= TTL_MS) return null;
  return { steps: entry.steps, lang: entry.lang, createdAt: entry.createdAt, guest: entry.guest !== false };
}

export function createShare(steps, lang, guest = true) {
  let store = loadShares();
  store = pruneShares(store);
  const id = crypto.randomBytes(5).toString("base64url");
  store[id] = { steps, lang, createdAt: Date.now(), guest };
  saveShares(store);
  return id;
}
