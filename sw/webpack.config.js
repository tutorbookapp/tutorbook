const path = require('path');
const Dotenv = require('dotenv-webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'sw.js',
    path: path.resolve(__dirname, '../public'),
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, '../.env'),
      // When deploying to Vercel NOW, we use the system variables that are
      // populated by Vercel. These variables trump whatever is in the local
      // .env file (though it should be empty anyways).
      systemvars: true,
    }),
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
};
