import Head from 'next/head';
import React from 'react';

/**
 * Defines our custom `<head>` tag properties. Note that the `/favicon/`
 * directory is contained in the `public/` directory in the root of this
 * repository (as per Next.js instructions).
 * @see {@link https://nextjs.org/docs/basic-features/static-file-serving}
 * @see {@link https://nextjs.org/docs/api-reference/next/head}
 */
export default function CovidHead(): JSX.Element {
  return (
    <Head>
      <title>Tutorbook</title>
      <meta charSet='UTF-8' />
      <meta name='viewport' content='width=device-width,initial-scale=1.0' />
      <meta
        name='description'
        content={
          'Web app that connects students in need (who no longer have face-to' +
          '-face support from teachers due to COVID-19) with volunteer tutors' +
          ' (who want to make a difference from home).'
        }
      />
      <link
        rel='icon'
        type='image/png'
        sizes='512x512'
        href='/favicon/favicon-512x512.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='192x192'
        href='/favicon/favicon-192x192.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='32x32'
        href='/favicon/favicon-32x32.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='16x16'
        href='/favicon/favicon-16x16.png'
      />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta
        name='apple-mobile-web-app-status-bar-style'
        content='translucent-black'
      />
      <meta name='apple-mobile-web-app-title' content='Tutorbook' />
      <link
        rel='apple-touch-icon'
        sizes='180x180'
        href='/favicon/apple-touch-icon.png'
      />
      <link
        rel='mask-icon'
        href='/favicon/safari-pinned-tab.svg'
        color='#6200EE'
      />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='application-name' content='Tutorbook' />
      <meta name='theme-color' content='#FFFFFF' />
      <link rel='manifest' href='/favicon/manifest.json' />
      <link rel='shortcut icon' href='/favicon/favicon.ico' />
      <meta name='msapplication-tap-highlight' content='no' />
      <meta name='msapplication-config' content='/favicon/browserconfig.xml' />
      <meta name='msapplication-TileColor' content='#FFFFFF' />
      <meta name='msapplication-navbutton-color' content='#6200EE' />
    </Head>
  );
}
