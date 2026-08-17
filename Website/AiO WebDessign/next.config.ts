import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* [16/08] STATIC_EXPORT=1 -> xuat HTML tinh (thu muc out/) de deploy Vercel.
     Khong dat co nay thi config y nguyen nhu cu — duong vinext/Cloudflare
     (npm run dev / build) khong bi anh huong. */
  ...(process.env.STATIC_EXPORT ? { output: "export" as const } : {}),
};

export default nextConfig;
