const path = require('path');

module.exports = {
  extends: path.resolve(__dirname, '../.eslintrc.js'),
  rules: {
    // Allow testing dependencies to be listed as `devDependencies` (instead of
    // normal `dependencies`).
    // @see {@link https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-extraneous-dependencies.md}
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
