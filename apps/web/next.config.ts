import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ['@dorsal/ui-tokens', '@dorsal/schemas', '@dorsal/api-client', '@dorsal/domain'],
  serverExternalPackages: ['msw'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (cfg, { isServer }) => {
    if (isServer) {
      // Prevent msw/browser from being bundled on the server side.
      cfg.externals = [...(cfg.externals ?? []), { 'msw/browser': 'commonjs msw/browser' }];
    }
    return cfg;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default config;
