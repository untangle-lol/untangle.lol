/**
 * Server-side credit operations for guest (fingerprint) users.
 * All functions are synchronous (better-sqlite3).
 */
import { getDb } from "./db.js";

const FREE_CREDITS = 3;
const REFILL_SECS = 24 * 60 * 60; // 24h

/**
 * Atomically deduct 1 credit for the given fingerprint.
 * Returns { creditsRemaining, blocked }.
 */
export function deductFpCredit(fp) {
  if (!fp || typeof fp !== "string" || fp.length < 8) {
    return { creditsRemaining: 0, blocked: true };
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  return db.transaction(() => {
    let row = db.prepare(`SELECT balance, refill_at FROM fp_credits WHERE fp = ?`).get(fp);

    if (!row) {
      db.prepare(
        `INSERT INTO fp_credits (fp, balance, refill_at) VALUES (?, ?, ?)`
      ).run(fp, FREE_CREDITS, now + REFILL_SECS);
      row = { balance: FREE_CREDITS, refill_at: now + REFILL_SECS };
    } else if (row.balance <= 0 && now >= row.refill_at) {
      db.prepare(
        `UPDATE fp_credits SET balance = ?, refill_at = ?, updated_at = unixepoch() WHERE fp = ?`
      ).run(FREE_CREDITS, now + REFILL_SECS, fp);
      row = { balance: FREE_CREDITS, refill_at: now + REFILL_SECS };
    }

    if (row.balance <= 0) {
      return { creditsRemaining: 0, blocked: true };
    }

    db.prepare(
      `UPDATE fp_credits SET balance = balance - 1, updated_at = unixepoch() WHERE fp = ?`
    ).run(fp);
    db.prepare(
      `INSERT INTO credit_transactions (fp, delta, reason) VALUES (?, -1, 'deduct')`
    ).run(fp);

    const after = db.prepare(`SELECT balance FROM fp_credits WHERE fp = ?`).get(fp).balance;
    return { creditsRemaining: after, blocked: false };
  })();
}

/** Add N credits to a fingerprint (used after payment for guests). */
export function addFpCredits(fp, n, meta = null) {
  if (!fp || typeof fp !== "string") return;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO fp_credits (fp, balance, refill_at) VALUES (?, ?, ?)
     ON CONFLICT(fp) DO UPDATE SET balance = balance + ?, updated_at = unixepoch()`
  ).run(fp, n, now + REFILL_SECS, n);
  db.prepare(
    `INSERT INTO credit_transactions (fp, delta, reason, meta) VALUES (?, ?, 'purchase', ?)`
  ).run(fp, n, meta ? JSON.stringify(meta) : null);
}

/** Get current balance for a fingerprint without deducting. */
export function getFpCredits(fp) {
  if (!fp || typeof fp !== "string") return FREE_CREDITS;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare(`SELECT balance, refill_at FROM fp_credits WHERE fp = ?`).get(fp);
  if (!row) return FREE_CREDITS;
  if (row.balance <= 0 && now >= row.refill_at) return FREE_CREDITS;
  return Math.max(0, row.balance);
}
