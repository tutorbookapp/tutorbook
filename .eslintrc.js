const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'postcss-modules'],
  parserOptions: {
    project: [
      path.resolve(__dirname, 'tsconfig.json'),
      path.resolve(__dirname, 'sw/tsconfig.json'),
      path.resolve(__dirname, 'firebase/functions/tsconfig.json'),
      path.resolve(__dirname, 'aws/tsconfig.json'),
    ],
  },
  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
    'plugin:postcss-modules/recommended',
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 2,
    'react/static-property-placement': ['error', 'static public field'],
    // Support Typescript's triple slash directive comments in reference files.
    // {@link https://github.com/typescript-eslint/typescript-eslint/issues/600}
    'spaced-comment': ['error', 'always', { markers: ['/'] }],
    // Bind methods in constructor (don't use arrow functions as class fields).
    // {@link https://github.com/airbnb/javascript/tree/master/react#methods}
    // {@link https://github.com/typescript-eslint/typescript-eslint/issues/636}
    '@typescript-eslint/unbound-method': 1,
    // We're disabling this so often, it just made sense to make it a 'warning'.
    // {@link https://github.com/airbnb/javascript/tree/master/react#props}
    // {@link https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-spreading.md}
    'react/jsx-props-no-spreading': 1,
    // Configure `jsx-a11y` to recognize RMWC input components as controls.
    // {@link https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/label-has-associated-control.md#case-my-label-and-input-components-are-custom-components}
    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        controlComponents: ['Checkbox', 'TextField', 'Select'],
      },
    ],
    // Use `void` operator to deal with dangling promises.
    // @example
    // public componentDidUpdate(): void {
    //   void someAsyncSideEffectFunction();
    // }
    //
    // private async someAsyncSideEffectFunction(): Promise<void> {
    //   ...do async side effect stuff
    // }
    'no-void': ['error', { allowAsStatement: true }],
    // Specify inferable types for function parameters. Otherwise, we get type
    // errors when trying to do something like this:
    // @example
    // async function search(query: string = '') {
    //   const { users } = await new Query({ query }).search();
    //   return users.map(userToOption);
    // }
    '@typescript-eslint/no-inferrable-types': [1, { ignoreParameters: false }],
    // Allow for skipping code paths by returning undefined values or callbacks.
    // @example
    // function doSomething(val: string) {
    //   if (val === 'do-nothing') return;
    //   if (val === 'do-this-thing') return doThisThing():
    //   doSomethingElse();
    // }
    'consistent-return': [1, { treatUndefinedAsUnspecified: true }],
  },
  reportUnusedDisableDirectives: true,
  settings: {
    'postcss-modules': {
      camelCase: true,
      include: /\.scss$/,
      exclude: /\/node_modules\//,
    },
  },
};
