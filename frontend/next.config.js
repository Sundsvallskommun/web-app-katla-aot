/* eslint-disable @typescript-eslint/no-require-imports */
const envalid = require('envalid');
const path = require('node:path');

const authDependent = envalid.makeValidator((x) => {
  const authEnabled = process.env.HEALTH_AUTH === 'true';

  if (authEnabled && !x.length) {
    throw new Error(`Can't be empty if "HEALTH_AUTH" is true`);
  }

  return x;
});

envalid.cleanEnv(process.env, {
  NEXT_PUBLIC_API_URL: envalid.str(),
  HEALTH_AUTH: envalid.bool(),
  HEALTH_USERNAME: authDependent(),
  HEALTH_PASSWORD: authDependent(),
});

module.exports = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ['dev.test'],
  images: {
    remotePatterns: process.env.DOMAIN_NAME ? [{ protocol: 'https', hostname: process.env.DOMAIN_NAME }] : [],
    formats: ['image/avif', 'image/webp'],
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  experimental: {
    optimizePackageImports: ['@sk-web-gui/core', '@sk-web-gui/react', 'lodash', 'dayjs'],
  },
  async rewrites() {
    return [{ source: '/napi/:path*', destination: '/api/:path*' }];
  },
};
