const path = require('path');

module.exports = {
  /*
   *sassLoaderOptions: {
   *  sassOptions: {
   *    includePaths: [path.resolve(__dirname, 'node_modules')],
   *  },
   *},
   */
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
};
