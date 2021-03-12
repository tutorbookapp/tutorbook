/**
 * Instruments our code (only when running tests).
 * @see {@link https://babeljs.io/docs/en/configuration#babelconfigjson}
 * @see {@link https://docs.cypress.io/guides/tooling/code-coverage.html#Instrumenting-code}
 *
 * Only include the recharts modules we actually need.
 * @todo Once TypeScript support has been merged, add the `recharts` plugin.
 * @see {@link https://github.com/recharts/babel-plugin-recharts/pull/22}
 * @see {@link https://github.com/recharts/babel-plugin-recharts}
 */
module.exports = {
  presets: ['next/babel'],
  plugins: process.env.NODE_ENV === 'test' ? ['istanbul'] : [],
};
