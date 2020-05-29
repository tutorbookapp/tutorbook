import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';
import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';
import { Aspect } from '@tutorbook/model';

import Intercom from '@tutorbook/react-intercom';
import Header from '@tutorbook/header';
import Footer from '@tutorbook/footer';
import VolunteerForm from '@tutorbook/volunteer-form';

function SignupPage(): JSX.Element {
  const [aspect, setAspect] = React.useState<Aspect>('mentoring');
  return (
    <>
      <Header
        aspect={aspect}
        onChange={(aspect: Aspect) => setAspect(aspect)}
        formWidth
      />
      <VolunteerForm aspect={aspect} />
      <Footer formWidth />
      <Intercom />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(SignupPage);
