import React from 'react';

import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Aspect } from '@tutorbook/model';
import { AspectHeader } from '@tutorbook/header';

import Intercom from '@tutorbook/react-intercom';
import Hero from '@tutorbook/hero';
import About from '@tutorbook/about';
import Footer from '@tutorbook/footer';

function IndexPage(): JSX.Element {
  const [aspect, setAspect] = React.useState<Aspect>('mentoring');
  return (
    <>
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
  props: await getIntlProps(context),
});

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(IndexPage);
