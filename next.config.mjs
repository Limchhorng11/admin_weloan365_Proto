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
};

export default nextConfig;
