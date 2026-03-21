import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@assessment/types', '@assessment/utils'],
};

export default nextConfig;
