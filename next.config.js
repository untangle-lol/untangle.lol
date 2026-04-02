/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // Old share URL format → new clean plan URL
      { source: "/s/:id", destination: "/id/:id", permanent: true },
      // Note: /?id= redirects are handled in middleware.js to avoid Next.js
      // appending the query param to the destination URL.
    ];
  },
  async rewrites() {
    // Admin SPA routes that don't have their own page.jsx
    return [{ source: "/revenue", destination: "/" }];
  },
  async headers() {
    return [
      {
        // HTML pages: always revalidate so deploys are picked up immediately
        source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml)).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Hashed static assets: cache forever (filename changes on every build)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
