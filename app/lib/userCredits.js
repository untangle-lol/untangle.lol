/**
 * Server-side credit operations for authenticated users.
 * All functions are synchronous (better-sqlite3).
 */
import { getDb } from "./db.js";

const FREE_CREDITS = 3;

/** Ensure a user row and a credits row exist for this email; return current balance. */
export function initCredits(email) {
  const db = getDb();
  // Ensure user exists (FK requirement) before touching credits
  db.prepare(
    `INSERT OR IGNORE INTO users (email, name) VALUES (?, ?)`
  ).run(email, email.split("@")[0]);
  db.prepare(
    `INSERT OR IGNORE INTO credits (email, balance) VALUES (?, ?)`
  ).run(email, FREE_CREDITS);
  return db.prepare(`SELECT balance FROM credits WHERE email = ?`).get(email).balance;
}

/** Return current balance without side effects. */
export function getBalance(email) {
  const db = getDb();
  const row = db.prepare(`SELECT balance FROM credits WHERE email = ?`).get(email);
  return row ? row.balance : FREE_CREDITS;
}

/**
 * Atomically deduct 1 credit.
 * Returns { balance, blocked }.
 */
export function deductCredit(email) {
  const db = getDb();
  initCredits(email);

  return db.transaction(() => {
    const row = db.prepare(`SELECT balance FROM credits WHERE email = ?`).get(email);
    if (!row || row.balance <= 0) {
      return { balance: 0, blocked: true };
    }
    db.prepare(
      `UPDATE credits SET balance = balance - 1, updated_at = unixepoch() WHERE email = ?`
    ).run(email);
    db.prepare(
      `INSERT INTO credit_transactions (email, delta, reason) VALUES (?, -1, 'deduct')`
    ).run(email);
    const after = db.prepare(`SELECT balance FROM credits WHERE email = ?`).get(email).balance;
    return { balance: after, blocked: false };
  })();
}

/**
 * Add N credits to an account.
 * reason: 'purchase' | 'altruism' | 'admin' | 'free_init'
 */
export function addCredits(email, n, reason = "purchase", meta = null) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO credits (email, balance) VALUES (?, 0)`).run(email);
  db.prepare(
    `UPDATE credits SET balance = balance + ?, updated_at = unixepoch() WHERE email = ?`
  ).run(n, email);
  db.prepare(
    `INSERT INTO credit_transactions (email, delta, reason, meta) VALUES (?, ?, ?, ?)`
  ).run(email, n, reason, meta ? JSON.stringify(meta) : null);
  return db.prepare(`SELECT balance FROM credits WHERE email = ?`).get(email).balance;
}

/**
 * Directly set balance (admin use).
 */
export function setBalance(email, n) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO credits (email, balance) VALUES (?, 0)`).run(email);
  const prev = db.prepare(`SELECT balance FROM credits WHERE email = ?`).get(email)?.balance ?? 0;
  db.prepare(
    `UPDATE credits SET balance = ?, updated_at = unixepoch() WHERE email = ?`
  ).run(n, email);
  db.prepare(
    `INSERT INTO credit_transactions (email, delta, reason) VALUES (?, ?, 'admin')`
  ).run(email, n - prev);
  return n;
}
