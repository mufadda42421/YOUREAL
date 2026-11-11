import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components + Partial Prefetching (enabled by the scaffold) cause
  // multi-second navigation latency and dead first clicks in this client-heavy,
  // auth-gated app — every route here renders client-side from Firestore anyway.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
