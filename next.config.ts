import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: "dtaxllamkswcgznkezuh.supabase.co", // 👈 your Supabase project ref
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
