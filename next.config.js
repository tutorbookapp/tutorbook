const path = require('path');
const { locales } = require('./src/intl/config.json');

module.exports = {
  experimental: {
    sassOptions: {
      includePaths: [path.resolve(__dirname, 'node_modules')],
    },
    redirects() {
      // Not exactly sure why this is happening, but going to `/[locale]/` with
      // a trailing slash seems to break Next.js's routing. Here, we just always
      // redirect to the page without the trailing slash.
      // @see {@link https://github.com/zeit/next.js/issues/9081#issuecomment-623786364}
      //
      // Also note that these aren't permanent in development mode (so that our
      // browser doesn't cache them while we're working).
      return [
        {
          source: '/:locale/',
          destination: '/:locale',
          permanent: process.env.NODE_ENV !== 'development',
        },
      ];
    },
    rewrites() {
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
          // @see {@link https://github.com/UnlyEd/next-right-now/pull/42}
          // @see {@link https://github.com/pillarjs/path-to-regexp/issues/223}
          source: `/:locale((?!${locales.join('|')}|favicon)[^/]+)(.*)`,
          destination: '/api/redirect',
        },
      ];
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: {
        // Next.js already handles url() in css/sass/scss files.
        // See https://bit.ly/39HerRo for more info.
        test: /\.\w+(?<!(s?c|sa)ss)$/i,
      },
      use: 'svg-url-loader',
    });
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
};
