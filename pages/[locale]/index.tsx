import React, { useState } from 'react';

import { getIntlProps, getIntlPaths, withIntl } from 'lib/intl';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Aspect } from 'lib/model';
import { AspectHeader } from 'components/header';

import Banner from 'components/banner';
import Intercom from 'components/react-intercom';
import Hero from 'components/hero';
import About from 'components/about';
import Footer from 'components/footer';

function IndexPage(): JSX.Element {
  const [aspect, setAspect] = useState<Aspect>('mentoring');
  return (
    <>
      <Banner />
      <AspectHeader
        aspect={aspect}
        onChange={(newAspect: Aspect) => setAspect(newAspect)}
      />
      <Hero aspect={aspect} />
      <About />
      <div style={{ marginBottom: '60px' }}>
        <Hero aspect={aspect} />
      </div>
      <Footer />
      <Intercom />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context, ['common', 'about', 'query']),
});

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(IndexPage);
