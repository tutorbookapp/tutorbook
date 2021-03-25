/**
 * Instruments our code (only when running tests).
 * @see {@link https://babeljs.io/docs/en/configuration#babelconfigjson}
 * @see {@link https://docs.cypress.io/guides/tooling/code-coverage.html#Instrumenting-code}
 *
 * Only includes the recharts modules we actually need.
 * @see {@link https://github.com/recharts/babel-plugin-recharts/pull/22}
 * @see {@link https://github.com/recharts/babel-plugin-recharts}
 * @todo Debug why this makes our build fail b/c of undefined components.
 */
module.exports = {
  presets: ['next/babel'],
  plugins: process.env.NODE_ENV !== 'production' ? ['istanbul'] : [],
};
