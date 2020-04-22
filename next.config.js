const path = require('path');

module.exports = {
  experimental: {
    sassOptions: {
      includePaths: [path.resolve(__dirname, 'node_modules')],
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
      use: ['svg-url-loader'],
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
    FIREBASE_ADMIN_TYPE: process.env.FIREBASE_ADMIN_TYPE,
    FIREBASE_ADMIN_KEY_ID: process.env.FIREBASE_ADMIN_KEY_ID,
    FIREBASE_ADMIN_KEY: process.env.FIREBASE_ADMIN_KEY,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_CLIENT_ID: process.env.FIREBASE_ADMIN_CLIENT_ID,
    FIREBASE_ADMIN_AUTH_URI: process.env.FIREBASE_ADMIN_AUTH_URI,
    FIREBASE_ADMIN_TOKEN_URI: process.env.FIREBASE_ADMIN_TOKEN_URI,
    FIREBASE_ADMIN_PROVIDER_CERT_URL:
      process.env.FIREBASE_ADMIN_PROVIDER_CERT_URL,
    FIREBASE_ADMIN_CLIENT_CERT_URL: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL,
    ALGOLIA_SEARCH_ID: process.env.ALGOLIA_SEARCH_ID,
    ALGOLIA_SEARCH_KEY: process.env.ALGOLIA_SEARCH_KEY,
  },
};
