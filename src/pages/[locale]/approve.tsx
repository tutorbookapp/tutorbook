import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Intercom from '../../react-intercom';
import ActionText from '../../action-text';
import Header from '../../covid-header';
import Footer from '../../covid-footer';

import { getIntlProps, getIntlPaths, withIntl } from '../../intl';

/**
 * Page that parents go to when approving (i.e. when giving parental consent
 * for) their child's pending lesson request.
 *
 * The following are sent via URL params in the email CTA link:
 * @param {string} request - The path of the pending lesson request's Firestore
 * document (this should be the path of the parent's child's document if there
 * are multiple pupil attendees).
 * @param {string} uid - The parent's user ID.
 * @todo Is it really required that we have the parent's user ID? Right now, we
 * only allow pupils to add the contact information of one parent. And we don't
 * really care **which** parent approves the lesson request anyways.
 */
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
