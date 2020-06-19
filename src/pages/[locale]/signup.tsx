import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';
import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';
import { Aspect } from '@tutorbook/model';
import { AspectHeader } from '@tutorbook/header';

import Banner from '@tutorbook/banner';
import Intercom from '@tutorbook/react-intercom';
import Footer from '@tutorbook/footer';
import VolunteerForm from '@tutorbook/volunteer-form';

function SignupPage(): JSX.Element {
  const [aspect, setAspect] = React.useState<Aspect>('mentoring');
  return (
    <>
      <Banner />
      <AspectHeader
        aspect={aspect}
        onChange={(newAspect: Aspect) => setAspect(newAspect)}
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

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(SignupPage);
