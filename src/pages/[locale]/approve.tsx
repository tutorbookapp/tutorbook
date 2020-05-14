import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Intercom from '../../react-intercom';
import ActionText from '../../action-text';
import Header from '../../covid-header';
import Footer from '../../covid-footer';

import { getIntlProps, getIntlPaths, withIntl } from '../../intl';

class ApprovePage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header />
        <ActionText loading headline='Approving...' />
        <Footer />
        <Intercom />
      </>
    );
  }

  public componentDidUpdate(): void {}
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(ApprovePage);
