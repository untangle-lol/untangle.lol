export default function sitemap() {
  const now = new Date().toISOString().split("T")[0];
  return [
    {
      url: "https://untangle.lol/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://untangle.lol/privacy",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://untangle.lol/terms",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://untangle.lol/donate",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
