import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** Safely extract the origin (scheme + host + port) from a URL-ish env value. */
function getOrigin(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// Backend/upload asset origins allowed for images (e.g. logos served from
// `<backend>/uploads/...`). Derived from configured env only — no wildcard.
// `'self'` already covers the frontend origin, so it is not added here.
const uploadImageOrigins = Array.from(
  new Set(
    [
      getOrigin(process.env.NEXT_PUBLIC_API_ORIGIN),
      getOrigin(process.env.NEXT_PUBLIC_API_URL),
      getOrigin(process.env.BACKEND_ORIGIN),
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

const imgSrc = ["'self'", "data:", "blob:", ...uploadImageOrigins].join(" ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src ${imgSrc}; connect-src 'self' *;`,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
