/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    // Large generated JSON is imported in server components only.
    largePageDataBytes: 512 * 1000,
  },
};

export default nextConfig;
