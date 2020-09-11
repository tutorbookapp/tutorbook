/**
 * Custom Babel configuration that instruments our code (only when running
 * tests).
 * @see {@link https://babeljs.io/docs/en/configuration#babelconfigjson}
 * @see {@link https://docs.cypress.io/guides/tooling/code-coverage.html#Instrumenting-code}
 */
module.exports = {
  presets: ['next/babel'],
  plugins: process.env.NODE_ENV === 'test' ? ['istanbul'] : [],
};
