import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Static assets from Next.js build — immutable, cache forever
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
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
  // Only upload source maps in production
  dryRun: process.env.NODE_ENV !== "production",
  // Disable automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: false,
  // Disable sentry CLI wizard
  disableServerWebpackPlugin: false,
});
