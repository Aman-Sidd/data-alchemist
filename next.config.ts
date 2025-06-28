import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack'; // 👈 Import Webpack config type
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config: WebpackConfig): WebpackConfig => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
