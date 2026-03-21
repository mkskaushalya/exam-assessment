import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@assessment/types', '@assessment/utils'],
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
};

export default nextConfig;
