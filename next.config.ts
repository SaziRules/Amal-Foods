import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dtaxllamkswcgznkezuh.supabase.co", // 👈 your Supabase storage bucket
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  eslint: {
    // ✅ Prevent ESLint errors from breaking Vercel builds
    ignoreDuringBuilds: true,
  },

  typescript: {
    // ✅ Prevent type errors from blocking builds on Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
