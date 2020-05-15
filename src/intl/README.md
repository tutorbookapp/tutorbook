# `@tutorbook/translations`

This package contains all of the translations for Tutorbook's [new web
app](https://tutorbook.org). We're using
[`react-intl`](https://formatjs.io/docs/react-intl) for the i18n of our website.

Take a look at [this blog
post](https://medium.com/javascript-in-plain-english/internationalization-in-react-apps-using-react-intl-1d72a6f14053)
for some examples that are similar to how we're localizing our website.

## Setup

To install the `formatjs` CLI (to automatically extract new `defaultMessages`
defined using the `defineMessages` React hook and the `FormattedMessage` React
component) run the following:

```
$ npm i -g formatjs
```

## Usage

To automatically extract new `defaultMessages` defined using the
`defineMessages` React hook and the `FormattedMessage` React component run the
following (from the root of the repository):

```
$ formatjs extract --out-file src/intl/locales/en.json src/*/lib/*.tsx
```
