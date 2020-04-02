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
      use: ['svg-url-loader'],
    });
    return config;
  },
};
