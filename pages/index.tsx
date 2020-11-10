import ContactCTA from 'components/landing/contact-cta';
import HeroTitle from 'components/landing/hero-title';
import Page from 'components/page';
import Screenshots from 'components/landing/screenshots';
import Spotlight from 'components/landing/spotlight';
import { TabHeader } from 'components/navigation';
import UseCases from 'components/landing/use-cases';

import LandingImage from 'components/landing/imgs/landing.png';
import MatchingImage from 'components/landing/imgs/matching.png';
import SearchImage from 'components/landing/imgs/search.png';
import SignupImage from 'components/landing/imgs/signup.png';
import VettingImage from 'components/landing/imgs/vetting.png';

import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import landing from 'locales/en/landing.json';

function OrgsPage(): JSX.Element {
  return (
    <Page title='Support at scale - Tutorbook' intercom>
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
        vid='/demos/landing.mp4'
        img={LandingImage}
      />
      <Spotlight
        num={2}
        header='Onboard volunteers'
        body='Onboard new volunteers via a fully customizable signup page.'
        vid='/demos/signup.mp4'
        img={SignupImage}
      />
      <Spotlight
        num={3}
        header='Vet new volunteers'
        body='Meet with new volunteers before adding them to your secure search view.'
        vid='/demos/vetting.mp4'
        img={VettingImage}
      />
      <Spotlight
        num={4}
        header='Share your search link'
        body='Students can search your vetted volunteers and send them requests directly.'
        vid='/demos/search.mp4'
        img={SearchImage}
      />
      <Spotlight
        num={5}
        header='Schedule appointments'
        body='Match volunteers and schedule meeting times via your admin dashboard.'
        vid='/demos/matching.mp4'
        img={MatchingImage}
      />
      <ContactCTA />
    </Page>
  );
}

// TODO: Finish porting over the static text contact into i18n JSON files.
export default withI18n(OrgsPage, { common, landing });
