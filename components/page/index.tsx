import { ReactNode, useEffect } from 'react';
import Head from 'next/head';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import Footer from 'components/footer';
import Segment from 'components/segment';

import styles from './page.module.scss';

export interface PageProps {
  title: string;
  description?: string;
  children: ReactNode;
  formWidth?: boolean;
  borderless?: boolean;
  intercom?: boolean;
}

export default function Page({
  title,
  description,
  children,
  formWidth,
  borderless,
  intercom,
}: PageProps): JSX.Element {
  const { t } = useTranslation();

  useEffect(() => {
    if (intercom) return document.body.classList.add('intercom');
    return document.body.classList.remove('intercom');
  }, [intercom]);

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name='description' content={description} />}
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1.0' />
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
          sizes='96x96'
          href='/favicon/favicon-96x96.png'
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
          sizes='57x57'
          href='/favicon/apple-icon-57x57.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='60x60'
          href='/favicon/apple-icon-60x60.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='72x72'
          href='/favicon/apple-icon-72x72.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='76x76'
          href='/favicon/apple-icon-76x76.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='114x114'
          href='/favicon/apple-icon-114x114.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='120x120'
          href='/favicon/apple-icon-120x120.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='144x144'
          href='/favicon/apple-icon-144x144.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='152x152'
          href='/favicon/apple-icon-152x152.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/favicon/apple-icon-180x180.png'
        />
        <link
          rel='mask-icon'
          href='/favicon/safari-pinned-tab.svg'
          color='#0070f3'
        />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='application-name' content='Tutorbook' />
        <meta name='theme-color' content='#ffffff' />
        <link rel='manifest' href='/favicon/manifest.json' />
        <link rel='shortcut icon' href='/favicon/favicon.ico' />
        <meta name='msapplication-tap-highlight' content='no' />
        <meta
          name='msapplication-config'
          content='/favicon/browserconfig.xml'
        />
        <meta name='msapplication-TileColor' content='#ffffff' />
        <meta
          name='msapplication-TileImage'
          content='/favicon/ms-icon-144x144.png'
        />
        <meta name='msapplication-navbutton-color' content='#0070f3' />
        <script src='/segment.js' async />
      </Head>
      <div
        data-cy='page'
        className={cn(styles.wrapper, { [styles.borderless]: borderless })}
      >
        {children}
      </div>
      <Footer formWidth={formWidth} />
      <Segment intercom={intercom} />
    </>
  );
}
