import React from 'react';

import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getIntlProps, withIntl, IntlProps } from 'lib/intl';
import { Aspect } from 'lib/model';
import { AspectHeader } from 'components/header';

import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import VolunteerPage from 'components/volunteer-page';

interface SignupPageQuery extends ParsedUrlQuery {
  org: string;
  locale: string;
}

export const getServerSideProps: GetServerSideProps<
  IntlProps,
  SignupPageQuery
> = async (context: GetServerSidePropsContext<SignupPageQuery>) => ({
  props: await getIntlProps(context),
});

function SignupPage(): JSX.Element {
  const [aspect, setAspect] = React.useState<Aspect>('mentoring');
  const { query } = useRouter();
  return (
    <>
      <AspectHeader
        aspect={aspect}
        onChange={(newAspect: Aspect) => setAspect(newAspect)}
        formWidth
      />
      <VolunteerPage org={query.org as string} aspect={aspect} />
      <Footer formWidth />
      <Intercom />
    </>
  );
}

export default withIntl(SignupPage);
