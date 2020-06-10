import React from 'react';

import { getIntlProps, getIntlPaths, withIntl } from '@tutorbook/intl';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Aspect } from '@tutorbook/model';

import Intercom from '@tutorbook/react-intercom';
import Header from '@tutorbook/header';
import Hero from '@tutorbook/hero';
import About from '@tutorbook/about';
import Footer from '@tutorbook/footer';

function IndexPage(): JSX.Element {
  const [aspect, setAspect] = React.useState<Aspect>('mentoring');
  return (
    <>
      <Header
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

export const getStaticPaths: GetStaticPaths = () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(IndexPage);
