import { GetStaticProps, GetStaticPaths } from 'next';
import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';
import { LinkHeader } from '@tutorbook/header';

import React from 'react';
import Login from '@tutorbook/login';
import Footer from '@tutorbook/footer';
import Intercom from '@tutorbook/react-intercom';

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
