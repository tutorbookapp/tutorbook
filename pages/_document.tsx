import NextDocument, { Html, Head, Main, NextScript } from 'next/document';

// Prevent FOUC on Firefox due to an age-old script processing bug.
// @see {@link https://nextjs.org/docs/advanced-features/custom-document}
// @see {@link https://github.com/vercel/next.js/issues/22465}
export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head />
        <body>
          <script>0</script>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
