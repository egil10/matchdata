import { readFileSync } from "node:fs";

// Derive a content version from the generated data so client fetches can be
// cached forever and only bust when the data actually changes (per build).
let DATA_VERSION = "1";
try {
  const meta = JSON.parse(readFileSync("./public/data/meta.json", "utf8"));
  DATA_VERSION = String(meta.generatedAt || "1").replace(/[^0-9]/g, "").slice(0, 14) || "1";
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  compress: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_DATA_VERSION: DATA_VERSION },
  experimental: {
    largePageDataBytes: 512 * 1000,
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async headers() {
    return [
      {
        // /public/data JSON is content-versioned via ?v=, so cache forever.
        source: "/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
