import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone testing through this computer's Ethernet and Wi-Fi addresses.
  allowedDevOrigins: ["192.168.1.165", "192.168.86.60"],
};

export default nextConfig;
