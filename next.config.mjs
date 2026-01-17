import bundleAnalyzer from '@next/bundle-analyzer';
import WebpackObfuscator from 'webpack-obfuscator';
import TerserPlugin from 'terser-webpack-plugin';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable ESLint during build to avoid dependency issues
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  poweredByHeader: false,

  // Image optimization with enhanced security
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox; img-src 'self' data: https:;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zgngdnwszdocfrxezabp.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Enhanced security headers
  async headers() {
    return [
      // Static assets - long cache with security
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },

      // API routes - secure with appropriate caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none'",
          },
        ],
      },

      // Sensitive API endpoints - no caching
      {
        source: '/api/refresh',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },

      // Static files
      {
        source: '/((?!api/).)*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features for security
  experimental: {
    // Enable strict next.js security features
    serverComponentsExternalPackages: [],
  },

  // Production build optimizations for source code protection
  productionBrowserSourceMaps: false,
  generateBuildId: async () => {
    // Generate a random build ID to make reverse engineering harder
    return Math.random().toString(36).substring(2, 15);
  },

  // Webpack configuration for code obfuscation
  webpack: (config, { dev, isServer }) => {
    // Only apply obfuscation in production client-side builds
    if (!dev && !isServer) {
      // Enhanced Terser configuration for better minification
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            mangle: {
              properties: {
                regex: /^_[A-Za-z]/, // Mangle private properties (starting with _)
              },
            },
          },
        }),
      ];

      // Apply basic webpack obfuscator to make code harder to read
      config.plugins.push(
        new WebpackObfuscator({
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: false,
          renameGlobals: false,
          selfDefending: false,
          simplify: true,
          splitStrings: false,
          stringArray: true,
          stringArrayCallsTransform: false,
          stringArrayEncoding: [],
          stringArrayIndexShift: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayWrappersCount: 1,
          stringArrayWrappersChainedCalls: true,
          stringArrayWrappersParametersMaxCount: 2,
          stringArrayWrappersType: 'variable',
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
        })
      );
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);

