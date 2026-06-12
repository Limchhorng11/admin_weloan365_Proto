/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      // Add allowed image hosts here, e.g.
      // { protocol: "https", hostname: "images.example.com" },
    ],
  },
  webpack: (config, { dev }) => {
    // On Windows the webpack persistent filesystem cache frequently fails to
    // rename its .pack.gz files, corrupting .next manifests and breaking the
    // dev server on recompile. Use the in-memory cache in dev to avoid this.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
