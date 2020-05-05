import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Header from '../../header';
import Footer from '../../footer';
import HeroForm from '../../hero-form';
import HeroAbout from '../../hero-about';

import { getIntlProps, getIntlPaths, withIntl } from '../../intl';

class IndexPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header white />
        <HeroForm />
        <HeroAbout />
        <Footer />
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
