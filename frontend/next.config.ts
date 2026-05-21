import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_BUILD_TS: Date.now().toString(),
  },
};

export default nextConfig;
