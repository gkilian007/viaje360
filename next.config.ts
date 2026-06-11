import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
    ],
  },
  async headers() {
    return [
      // NOTE: no custom rule for /_next/static — Next.js already serves hashed
      // build assets as immutable in production, and forcing immutable here also
      // applied in dev, where Turbopack chunk names are NOT content-hashed:
      // browsers cached stale chunks forever (old code survived rebuilds).
      // Public PWA icons
      {
        source: "/:icon(icon-.*\\.png|apple-touch-icon\\.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Service worker — must NOT be cached (browser checks for updates)
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      // Manifest — short cache
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs during CI/CD
  silent: true,
  // Disable Sentry telemetry
  telemetry: false,
  // Disable automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: false,
  // Only upload source maps when SENTRY_AUTH_TOKEN is set
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
