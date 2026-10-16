import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_ORIGIN ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
