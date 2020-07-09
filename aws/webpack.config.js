const path = require('path');
const nodeExternals = require('webpack-node-externals');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
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
    extensions: ['.ts', '.js', '.json'],
  },
  output: {
    path: path.resolve(__dirname),
    filename: 'index.js',
    // Bundle as a UMD library so they can be loaded by AWS Lambda.
    // @see {@link https://webpack.js.org/guides/author-libraries/}
    library: 'index',
    libraryTarget: 'umd',
  },
  // The `aws-sdk` is already available on the AWS Lambda Node.js runtime env.
  // @see {@link https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html}
  externals: [/^aws-sdk\/.+$/, nodeExternals()],
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
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  target: 'node',
};
