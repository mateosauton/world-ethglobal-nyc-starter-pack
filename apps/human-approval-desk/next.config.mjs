import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(appDir, "../.."),
  turbopack: {
    root: path.resolve(appDir, "../..")
  },
  transpilePackages: ["@world-starter/world-patterns"]
};

export default nextConfig;
