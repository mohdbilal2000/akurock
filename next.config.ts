import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Hostinger shared hosting / Node.js deployment
  // Creates a self-contained build in .next/standalone that can run with just `node server.js`
  output: 'standalone',

  // Image optimization — use unoptimized on shared hosting (no sharp binary)
  images: {
    unoptimized: true,
  },

  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      // Webflow Commerce checkout → our quotation system
      {
        source: '/:locale(de|en|es)/checkout',
        destination: '/:locale/quotation',
        permanent: false,
      },
      {
        source: '/checkout',
        destination: '/de/quotation',
        permanent: false,
      },
      // Cart link → homepage (cart drawer opens via JS)
      {
        source: '/:locale(de|en|es)/cart',
        destination: '/:locale',
        permanent: false,
      },
      {
        source: '/cart',
        destination: '/de',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      // HTML documents must NOT be cached long-term by the CDN. Otherwise a
      // redeploy (which changes the hashed asset filenames) leaves the CDN
      // serving stale HTML that references the OLD, now-deleted CSS/JS chunks →
      // those 404 → the page renders with no styles. Force revalidation for
      // page/document routes (everything except hashed static assets, which
      // keep their own immutable/long-cache headers below).
      {
        source: '/((?!_next/|images/|js/|css/|fonts/|videos/|documents/|api/|.*\\.).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ajax.googleapis.com https://cdn.jsdelivr.net https://d3e54v103j8qbb.cloudfront.net https://code.jquery.com https://embedsocial.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://embedsocial.com https://*.wizart.ai",
              // Allow the embedded tools/media that the site actually uses:
              // Wizart Fitting Room (Visualizer page), YouTube tutorial videos, EmbedSocial reviews
              "frame-src 'self' https://pim-client.wizart.ai https://*.wizart.ai https://www.youtube.com https://www.youtube-nocookie.com https://embedsocial.com",
              "media-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      // Long cache for immutable assets
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Short cache with stale-while-revalidate for JS/CSS (may change on deploy)
      {
        source: '/js/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/css/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

// Bundle analyzer (run with ANALYZE=true npx next build)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
