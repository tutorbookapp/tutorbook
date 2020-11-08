import ContactCTA from 'components/landing/contact-cta';
import HeroTitle from 'components/landing/hero-title';
import Page from 'components/page';
import Screenshots from 'components/landing/screenshots';
import Spotlight from 'components/landing/spotlight';
import { TabHeader } from 'components/navigation';
import UseCases from 'components/landing/use-cases';

import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';

function OrgsPage(): JSX.Element {
  return (
    <Page title='Support at scale - Tutorbook'>
      <TabHeader
        tabs={[
          {
            label: 'Organizations',
            active: true,
            href: '/',
          },
          {
            label: 'Students',
            href: '/students',
          },
        ]}
      />
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

export default withI18n(OrgsPage, { common });
