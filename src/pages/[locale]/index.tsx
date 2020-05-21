import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Intercom from '@tutorbook/react-intercom';
import Header from '@tutorbook/covid-header';
import Footer from '@tutorbook/covid-footer';
import HeroForm from '@tutorbook/hero-form';
import About from '@tutorbook/about';

import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';

class IndexPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header white />
        <HeroForm />
        <About />
        <Footer />
        <Intercom />
      </>
    );
  }
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(IndexPage);
