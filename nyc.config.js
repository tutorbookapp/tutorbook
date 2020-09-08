/**
 * Code coverage configuration for use with Cypress and Typescript.
 * @see {@link https://docs.cypress.io/guides/tooling/code-coverage.html}
 * @see {@link https://github.com/istanbuljs/nyc#selecting-files-for-coverage}
 */
module.exports = {
  all: true,
  extends: '@istanbuljs/nyc-config-typescript',
  include: [
    'pages/**',
    'components/**',
    'lib/**',
    'firebase/functions/**',
    'aws/**',
    'sw/**',
  ],
  exclude: ['pages/api/coverage.ts', '**/*.d.ts'],
};
