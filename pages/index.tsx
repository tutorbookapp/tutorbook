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

import { PageProps, getPageProps } from 'lib/page';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';

function OrgsPage(props: PageProps): JSX.Element {
  usePage({ name: 'Orgs Landing' });

  return (
    <Page
      title='Connect students with tutors and mentors - Tutorbook'
      description='Tutorbook is the best way to manage virtual tutoring and mentoring programs. Simple tutoring management software to onboard volunteers, match students, schedule lessons, and scale your organization.'
      borderless
      intercom
      {...props}
    >
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
      <HeroTitle
        header='Connect students with tutors and mentors'
        body='One app to manage everything. Onboard volunteers, match students, and scale your organization.'
      />
      <Screenshots />
      <UseCases />
      <Spotlight
        num={1}
        header='Share your landing page'
        body='Customize a landing page for your organization to share on social media.'
        mp4='/demos/landing.mp4'
        webm='/demos/landing.webm'
        img={LandingImage}
      />
      <Spotlight
        num={2}
        header='Onboard volunteers'
        body='Onboard new volunteers via a fully customizable signup page.'
        mp4='/demos/signup.mp4'
        webm='/demos/signup.webm'
        img={SignupImage}
      />
      <Spotlight
        num={3}
        header='Vet new volunteers'
        body='Meet with new volunteers before adding them to your secure search view.'
        mp4='/demos/vetting.mp4'
        webm='/demos/vetting.webm'
        img={VettingImage}
      />
      <Spotlight
        num={4}
        header='Share your search link'
        body='Students can search your vetted volunteers and send them requests directly.'
        mp4='/demos/search.mp4'
        webm='/demos/search.webm'
        img={SearchImage}
      />
      <Spotlight
        num={5}
        header='Schedule appointments'
        body='Match volunteers and schedule meeting times via your admin dashboard.'
        mp4='/demos/matching.mp4'
        webm='/demos/matching.webm'
        img={MatchingImage}
      />
      <ContactCTA
        header='Student support at scale'
        body='The best way to manage tutoring and mentoring programs.'
      />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(OrgsPage, { common });
