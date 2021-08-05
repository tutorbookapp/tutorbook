const path = require('path');
const { locales } = require('./lib/intl/config.json');

module.exports = {
  future: { webpack5: true },
  reactStrictMode: true,
  sassOptions: {
    includePaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'src/*/node_modules'),
    ],
  },
  images: {
    domains: ['assets.tutorbook.org', 'firebasestorage.googleapis.com'],
    imageSizes: [642, 350, 200, 160, 120, 85, 48, 40, 24],
  },
  async redirects() {
    return [
      {
        source: '/signup',
        destination: '/default/signup',
        permanent: true,
      },
      {
        source: '/:org/search/:id',
        destination: '/:org/users/:id',
        permanent: true,
      },
      {
        source: '/:org/people/:slug*',
        destination: '/:org/users/:slug*',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/overview',
        permanent: true,
      },
      {
        source: '/:org/dashboard',
        destination: '/:org/overview',
        permanent: true,
      },
    ];
  },
  webpack(config, { isServer, defaultLoaders }) {
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
    return config;
  },
};
