import React from 'react';

import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Query, Availability, Aspect } from '@tutorbook/model';

import Intercom from '@tutorbook/react-intercom';
import Header from '@tutorbook/header';
import Hero from '@tutorbook/hero';
import Footer from '@tutorbook/footer';

function IndexPage(): JSX.Element {
  const [query, setQuery] = React.useState<Query>({
    subjects: [],
    availability: new Availability(),
    aspect: 'mentoring',
  });
  return (
    <>
      <Header
        aspect={query.aspect}
        onChange={(aspect: Aspect) => setQuery({ ...query, aspect })}
      />
      <Hero query={query} onChange={(query: Query) => setQuery(query)} />
      <Footer />
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

export default withIntl(IndexPage);
