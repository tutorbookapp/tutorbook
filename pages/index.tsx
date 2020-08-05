import React, { useState } from 'react';

import { withI18n } from 'lib/intl';
import { Aspect } from 'lib/model';
import { AspectHeader } from 'components/navigation';

import Banner from 'components/banner';
import Intercom from 'components/react-intercom';
import Hero from 'components/hero';
import About from 'components/about';
import Footer from 'components/footer';

import common from 'locales/en/common.json';
import about from 'locales/en/about.json';
import query from 'locales/en/query.json';

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

export default withI18n(IndexPage, { common, about, query });
