import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Intercom from '../../react-intercom';
import Header from '../../covid-header';
import Footer from '../../covid-footer';
import PupilForm from '../../pupil-form';

import { getIntlProps, getIntlPaths, withIntl } from '../../intl';

class PupilsPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header />
        <PupilForm />
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

export default withIntl(PupilsPage);
