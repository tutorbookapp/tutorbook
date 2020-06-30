import { GetStaticProps, GetStaticPaths } from 'next';
import { getIntlProps, getIntlPaths, withIntl } from 'lib/intl';
import { LinkHeader } from 'components/header';

import React from 'react';
import Login from 'components/login';
import Footer from 'components/footer';
import Intercom from 'components/react-intercom';

function LoginPage(): JSX.Element {
  return (
    <>
      <LinkHeader />
      <Login />
      <Footer />
      <Intercom />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(LoginPage);
