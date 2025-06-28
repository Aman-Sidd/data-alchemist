import type { NextConfig } from "next";

// next.config.js
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: config => {
    config.resolve.alias['@'] = require('path').resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
