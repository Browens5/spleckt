import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "better-auth",
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
  transpilePackages: ["youtubei.js", "playcanvas"],
};

export default nextConfig;
