import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Equipment photos are served from Supabase Storage's public bucket
    // URL (https://<project-ref>.supabase.co/storage/v1/object/public/...).
    // next/image throws at runtime for any remote host not explicitly
    // allow-listed here — required for the farmer browse/detail pages
    // (Plan 01-03 Task 3) to render uploaded photos at all.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
