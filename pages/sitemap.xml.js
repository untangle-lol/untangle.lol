import fs from "fs";

const LANGS = [
  "nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"
];
const BASE = "https://untangle.lol";
const DATA_FILE = "/data/shares.json";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function loadPublicShares() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const store = JSON.parse(raw);
    const now = Date.now();
    return Object.entries(store)
      .filter(([, e]) => e.guest !== false && now - e.createdAt < TTL_MS)
      .map(([id, e]) => ({ id, createdAt: new Date(e.createdAt) }));
  } catch {
    return [];
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemapXml() {
  const now = new Date();

  const staticPages = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
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

  const pages = [...staticPages, ...planPages];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of pages) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
    xml += `    <lastmod>${page.lastModified.toISOString()}</lastmod>\n`;
    xml += `    <changefreq>${page.changeFrequency}</changefreq>\n`;
    xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  return xml;
}

export async function getServerSideProps({ res }) {
  const xml = generateSitemapXml();

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.write(xml);
  res.end();

  return {
    props: {},
  };
}

export default function Sitemap() {
  return null;
}
