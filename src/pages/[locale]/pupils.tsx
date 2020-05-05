import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Header from '../../header';
import Footer from '../../footer';
import PupilForm from '../../pupil-form';

import { getIntlProps, getIntlPaths, withIntl } from '../../intl';

class PupilsPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header sticky />
        <PupilForm />
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

export default withIntl(PupilsPage);
