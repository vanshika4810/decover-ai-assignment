import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["mammoth", "mongoose", "unpdf"],
};

export default nextConfig;
