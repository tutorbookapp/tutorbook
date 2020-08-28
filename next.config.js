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
  async redirects() {
    return [
      {
        source: '/signup',
        destination: '/default/signup',
        permanent: true,
      },
      {
        source: '/search/:slug*',
        destination: '/default/search/:slug*',
        permanent: true,
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
    INTERCOM_APP_ID: process.env.INTERCOM_APP_ID,
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
