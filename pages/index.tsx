import { EmptyHeader } from 'components/navigation';
import HeroTitle from 'components/landing/hero-title';
import Screenshots from 'components/landing/screenshots';
import UseCases from 'components/landing/use-cases';
import Spotlight from 'components/landing/spotlight';
import ContactCTA from 'components/landing/contact-cta';
import Page from 'components/page';

import { withI18n } from 'lib/intl';

import about from 'locales/en/about.json';
import banner from 'locales/en/banner.json';
import common from 'locales/en/common.json';
import match3rd from 'locales/en/match3rd.json';
import query3rd from 'locales/en/query3rd.json';

function IndexPage(): JSX.Element {
  return (
    <Page title='Support at scale - Tutorbook'>
      <EmptyHeader />
      <HeroTitle />
      <Screenshots />
      <UseCases />
      <Spotlight
        num={1}
        header='Share your landing page'
        body='Customize a landing page for your organization to share on social media.'
      />
      <Spotlight
        num={2}
        header='Onboard volunteers'
        body='Onboard new volunteers via a fully customizable signup page.'
      />
      <Spotlight
        num={3}
        header='Vet new volunteers'
        body='Meet with new volunteers before adding them to your secure search view.'
      />
      <Spotlight
        num={4}
        header='Share your search link'
        body='Students can search your vetted volunteers and send them requests directly.'
      />
      <Spotlight
        num={5}
        header='Schedule appointments'
        body='Replace Calendly, Picktime, and Oncehub with this all-in-one solution.'
      />
      <ContactCTA />
    </Page>
  );
}

export default withI18n(IndexPage, {
  common,
  about,
  banner,
  query3rd,
  match3rd,
});
