const withSass = require('@zeit/next-sass');
module.exports = withSass({
  cssModules: true,
  sassLoaderOptions: {
    implementation: require('sass'),
    sassOptions: {
      includePaths: ['src/pages/node_modules'],
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['svg-url-loader'],
    });
    return config;
  },
});
