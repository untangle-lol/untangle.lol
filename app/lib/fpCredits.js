import fs from "fs";

const DATA_FILE = "/data/fp_credits.json";
const FREE_CREDITS = 3;
const REFILL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_ENTRIES = 50_000; // prune when file grows too large

// Minimal file lock via a module-level promise chain
let queue = Promise.resolve();
const withLock = (fn) => { queue = queue.then(fn).catch(() => {}); return queue; };

function read() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return {}; }
}

function write(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
}

/**
 * Returns { credits, creditsRemaining } after deducting one credit for the given fingerprint.
 * credits       — credits before this request
 * creditsRemaining — credits after deduction (0 if already empty)
 * If credits are 0 and not yet refill time, returns { credits: 0, creditsRemaining: 0 }
 */
export function deductFpCredit(fp) {
  if (!fp || typeof fp !== "string" || fp.length < 8) {
    return { credits: 0, creditsRemaining: 0, blocked: true };
  }

  const store = read();
  const now = Date.now();
  let entry = store[fp];

  if (!entry) {
    // First time this fingerprint is seen
    entry = { credits: FREE_CREDITS, refillAt: now + REFILL_MS };
    store[fp] = entry;
  } else if (entry.credits <= 0 && now >= entry.refillAt) {
    // Refill window passed
    entry.credits = FREE_CREDITS;
    entry.refillAt = now + REFILL_MS;
  }

  const before = entry.credits;
  if (entry.credits <= 0) {
    write(store);
    return { credits: 0, creditsRemaining: 0, blocked: true };
  }

  entry.credits = Math.max(0, entry.credits - 1);

  // Prune oldest entries if store grows too large
  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    const sorted = keys.sort((a, b) => (store[a].refillAt || 0) - (store[b].refillAt || 0));
    sorted.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete store[k]);
  }

  write(store);
  return { credits: before, creditsRemaining: entry.credits, blocked: false };
}

/**
 * Add credits to a fingerprint (used after payment).
 */
export function addFpCredits(fp, n) {
  if (!fp || typeof fp !== "string") return;
  withLock(() => {
    const store = read();
    const now = Date.now();
    const entry = store[fp] ?? { credits: 0, refillAt: now + REFILL_MS };
    entry.credits = (entry.credits || 0) + n;
    store[fp] = entry;
    write(store);
  });
}

/**
 * Get current credits for a fingerprint without deducting.
 */
export function getFpCredits(fp) {
  if (!fp || typeof fp !== "string") return FREE_CREDITS;
  const store = read();
  const now = Date.now();
  const entry = store[fp];
  if (!entry) return FREE_CREDITS;
  if (entry.credits <= 0 && now >= entry.refillAt) return FREE_CREDITS;
  return Math.max(0, entry.credits);
}
