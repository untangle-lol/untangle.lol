import fs from "fs";

export const dynamic = "force-dynamic";

const LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];
const BASE   = "https://untangle.lol";
const DATA_FILE = "/data/shares.json";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function loadPublicShares() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const store = JSON.parse(raw);
    const now = Date.now();
    return Object.entries(store)
      .filter(([, e]) => e.guest !== false && now - e.createdAt < TTL_MS)
      .map(([id, e]) => ({ id, createdAt: new Date(e.createdAt).toISOString().split("T")[0] }));
  } catch {
    return [];
  }
}

export default function sitemap() {
  const now = new Date().toISOString().split("T")[0];

  const staticPages = [
    { url: `${BASE}/`,        lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`,   lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...LANGS.map((lang) => ({
      url: `${BASE}/donate/${lang}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];

  const planPages = loadPublicShares().map(({ id, createdAt }) => ({
    url: `${BASE}/id/${id}`,
    lastModified: createdAt,
    changeFrequency: "never",
    priority: 0.5,
  }));

  return [...staticPages, ...planPages];
}
