import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';

import Intercom from '@tutorbook/react-intercom';
import Header from '@tutorbook/header';
import Footer from '@tutorbook/footer';
import VolunteerForm from '@tutorbook/volunteer-form';

import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';

class TutorsPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header />
        <VolunteerForm />
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

export default withIntl(TutorsPage);
