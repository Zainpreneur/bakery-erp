import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repository root is above this app, so point Turbopack at the app itself.
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
