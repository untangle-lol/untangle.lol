// ─── Date / time utilities ────────────────────────────────────────────────────
export function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; } }

export function fmtDate(iso, z, lc) {
  try {
    return new Date(iso).toLocaleString(lc || undefined, { timeZone: z, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export function tAgo(iso, lc) {
  const d = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(d / 60000);
  const h  = Math.floor(d / 3600000);
  const dy = Math.floor(d / 86400000);
  if (lc === "nl") {
    if (m < 60) return m + " min geleden";
    if (h < 24) return h + " uur geleden";
    return dy === 1 ? "gisteren" : dy + " dagen geleden";
  }
  if (lc === "ar") {
    if (m < 60) return "منذ " + m + " دقيقة";
    if (h < 24) return "منذ " + h + " ساعة";
    return dy === 1 ? "أمس" : "منذ " + dy + " أيام";
  }
  if (m < 60) return m + "m ago";
  if (h < 24) return h + "h ago";
  return dy === 1 ? "yesterday" : dy + "d ago";
}

// ─── Loading phrases (fallback, English) ─────────────────────────────────────
export const LP = [
  ["🧠", "Thinking..."],
  ["☕", "Brewing ideas..."],
  ["🔮", "Crystal ball warming up..."],
  ["🧙", "Casting spells..."],
  ["🤔", "Deep thought..."],
  ["🎯", "Locking in..."],
];
