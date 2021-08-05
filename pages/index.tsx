import About from 'components/about';
import { EmptyHeader } from 'components/navigation';
import Page from 'components/page';

import { PageProps, getPageProps } from 'lib/page';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import query3rd from 'locales/en/query3rd.json';
import search from 'locales/en/search.json';

function AboutPage(props: PageProps): JSX.Element {
  usePage({ name: 'About' });

  return (
    <Page
      title='Tutorbook: Airbnb for tutoring'
      description='Tutorbook is the best way to manage virtual tutoring and mentoring programs. Simple tutoring management software to onboard volunteers, match students, schedule lessons, and scale your organization.'
      intercom
      {...props}
    >
      <EmptyHeader />
      <About />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(AboutPage, { common, search, query3rd });
