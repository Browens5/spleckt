import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sparkjsdev/spark"],
  serverExternalPackages: [
    "@libsql/client",
    "better-auth",
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
};

export default nextConfig;
