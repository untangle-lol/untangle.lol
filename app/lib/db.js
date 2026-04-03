import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH = "/data/untangle.db";
const FREE_CREDITS = 3;

let _db = null;

// Initialize eagerly at module load time (safe: /data exists at runtime, not at build time)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  try { getDb(); } catch {}
}

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email      TEXT PRIMARY KEY,
      name       TEXT,
      picture    TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      last_seen  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS credits (
      email      TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
      balance    INTEGER NOT NULL DEFAULT ${FREE_CREDITS},
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS fp_credits (
      fp         TEXT PRIMARY KEY,
      balance    INTEGER NOT NULL DEFAULT ${FREE_CREDITS},
      refill_at  INTEGER NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS magic_tokens (
      token      TEXT PRIMARY KEY,
      email      TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS pending_credits (
      client_ref TEXT PRIMARY KEY,
      credits    INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS claimed_sessions (
      session_id TEXT PRIMARY KEY,
      claimed_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT,
      fp         TEXT,
      delta      INTEGER NOT NULL,
      reason     TEXT NOT NULL,
      meta       TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      lang       TEXT NOT NULL,
      text       TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(lang, text)
    );
    CREATE INDEX IF NOT EXISTS idx_suggestions_lang ON suggestions(lang);
  `);

  migrateJson(db);
}

// One-time migration from JSON files → SQLite.
// Each block is idempotent: we skip if the marker file already exists.
function migrateJson(db) {
  const DONE = "/data/.json_migrated";
  if (fs.existsSync(DONE)) return;

  const read = (p) => {
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
  };

  // users.json  →  users + credits
  const users = read("/data/users.json");
  if (users) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO users (email, name, picture) VALUES (?, ?, ?)`
    );
    const insC = db.prepare(
      `INSERT OR IGNORE INTO credits (email, balance) VALUES (?, ?)`
    );
    db.transaction(() => {
      for (const [email, u] of Object.entries(users)) {
        ins.run(email, u.name || null, u.picture || null);
        insC.run(email, FREE_CREDITS);
      }
    })();
  }

  // magic_tokens.json
  const tokens = read("/data/magic_tokens.json");
  if (tokens) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO magic_tokens (token, email, expires_at, used) VALUES (?, ?, ?, ?)`
    );
    db.transaction(() => {
      for (const [token, t] of Object.entries(tokens)) {
        ins.run(token, t.email, Math.floor(t.expiresAt / 1000), t.used ? 1 : 0);
      }
    })();
  }

  // pending_credits.json
  const pending = read("/data/pending_credits.json");
  if (pending) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO pending_credits (client_ref, credits) VALUES (?, ?)`
    );
    db.transaction(() => {
      for (const [ref, n] of Object.entries(pending)) {
        ins.run(ref, n);
      }
    })();
  }

  // claimed_sessions.json
  const claimed = read("/data/claimed_sessions.json");
  if (claimed) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO claimed_sessions (session_id, claimed_at) VALUES (?, ?)`
    );
    db.transaction(() => {
      for (const [id, ts] of Object.entries(claimed)) {
        ins.run(id, Math.floor(ts / 1000));
      }
    })();
  }

  // fp_credits.json  (may be large — migrate best-effort)
  const fp = read("/data/fp_credits.json");
  if (fp) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO fp_credits (fp, balance, refill_at) VALUES (?, ?, ?)`
    );
    db.transaction(() => {
      for (const [fpId, e] of Object.entries(fp)) {
        ins.run(fpId, e.credits ?? FREE_CREDITS, Math.floor((e.refillAt || Date.now()) / 1000));
      }
    })();
  }

  // suggestions.json  →  suggestions table
  const suggestions = read("/data/suggestions.json");
  if (suggestions) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO suggestions (lang, text) VALUES (?, ?)`
    );
    db.transaction(() => {
      for (const [lang, items] of Object.entries(suggestions)) {
        if (!Array.isArray(items)) continue;
        for (const text of items) {
          if (typeof text === "string" && text.trim().length >= 3) {
            ins.run(lang, text.trim());
          }
        }
      }
    })();
  }

  fs.writeFileSync(DONE, String(Date.now()));
}
