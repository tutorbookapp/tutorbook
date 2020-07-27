import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import VolunteerPage from 'components/volunteer-page';

import React, { useState } from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';
import { getIntlProps, getIntlPaths, withIntl } from 'lib/intl';
import { Aspect } from 'lib/model';
import { AspectHeader } from 'components/header';

function SignupPage(): JSX.Element {
  const [aspect, setAspect] = useState<Aspect>('mentoring');
  return (
    <>
      <AspectHeader
        aspect={aspect}
        onChange={(newAspect: Aspect) => setAspect(newAspect)}
        formWidth
      />
      <VolunteerPage aspect={aspect} />
      <Footer formWidth />
      <Intercom />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context, [
    'common',
    'signup',
    'signup-page',
    'query',
  ]),
});

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(SignupPage);
