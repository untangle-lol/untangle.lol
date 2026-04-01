const LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];
const BASE   = "https://untangle.lol";

export default function sitemap() {
  const now = new Date().toISOString().split("T")[0];

  const donatePages = LANGS.map((lang) => ({
    url: `${BASE}/donate/${lang}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...donatePages,
  ];
}
