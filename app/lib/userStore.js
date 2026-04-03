import { getDb } from "./db.js";
import { initCredits } from "./userCredits.js";

/** Upsert profile for an email. Call on every successful login. */
export function upsertUser(email, { name, picture } = {}) {
  if (!email) return;
  const db = getDb();
  const existing = db.prepare(`SELECT name, picture FROM users WHERE email = ?`).get(email);
  db.prepare(`
    INSERT INTO users (email, name, picture, last_seen)
    VALUES (?, ?, ?, unixepoch())
    ON CONFLICT(email) DO UPDATE SET
      name     = COALESCE(excluded.name, name),
      picture  = COALESCE(excluded.picture, picture),
      last_seen = unixepoch()
  `).run(
    email,
    name  || existing?.name  || email.split("@")[0],
    picture || existing?.picture || null,
  );
  // Ensure a credits row exists (no-op if already present)
  initCredits(email);
}

/** Get stored profile for an email, or sensible defaults. */
export function getUser(email) {
  if (!email) return null;
  const db = getDb();
  const row = db.prepare(`SELECT name, picture FROM users WHERE email = ?`).get(email);
  return row ?? { name: email.split("@")[0], picture: null };
}
