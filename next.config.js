const path = require('path');
const withImages = require('next-images');
const { locales } = require('./lib/intl/config.json');

module.exports = withImages({
  reactStrictMode: true,
  sassOptions: {
    includePaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'src/*/node_modules'),
    ],
  },
  async rewrites() {
    return [
      {
        // We redirect the user to their appropriate locale directory based on
        // their browser request cookies (via the `/api/redirect` endpoint).
        // @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/35}
        source: '/',
        destination: '/api/redirect',
      },
      {
        // Don't redirect if there's a locale already in the requested URL. We
        // also don't redirect if the browser's just trying to fetch favicons.
        //
        // Note that Next.js should already exclude API endpoints from these
        // rewrites (but we keep it here just in case).
        //
        // @see {@link https://github.com/UnlyEd/next-right-now/pull/42}
        // @see {@link https://github.com/pillarjs/path-to-regexp/issues/223}
        source: `/:locale((?!${locales.join('|')}|favicon|api|sw.js)[^/]+)(.*)`,
        destination: '/api/redirect',
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer && process.env.ANALYZE === 'true') {
      // Only run the bundle analyzer for the client-side chunks.
      // @see {@link https://github.com/vercel/next.js/issues/15481}
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html',
          generateStatsFile: true,
        })
      );
    }
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'raw-loader',
    });
    return config;
  },
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    FIREBASE_ADMIN_KEY: process.env.FIREBASE_ADMIN_KEY,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    ALGOLIA_SEARCH_ID: process.env.ALGOLIA_SEARCH_ID,
    ALGOLIA_SEARCH_KEY: process.env.ALGOLIA_SEARCH_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    BRAMBLE_API_KEY: process.env.BRAMBLE_API_KEY,
  },
});
