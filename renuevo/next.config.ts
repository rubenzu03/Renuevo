import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/login", destination: "/", permanent: true }];
  },
};

export default nextConfig;
