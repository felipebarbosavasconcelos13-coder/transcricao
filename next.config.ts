import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fluent-ffmpeg"],
  outputFileTracingIncludes: {
    "/api/jobs": ["./node_modules/ffmpeg-static/**/*"],
    "/api/jobs/[id]/retry": ["./node_modules/ffmpeg-static/**/*"],
    "/api/public/jobs": ["./node_modules/ffmpeg-static/**/*"],
  },
};

export default nextConfig;
