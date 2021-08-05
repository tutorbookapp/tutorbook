import Hero from 'components/hero';
import Page from 'components/page';
import Students from 'components/students';
import { TabHeader } from 'components/navigation';

import { PageProps, getPageProps } from 'lib/page';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import about from 'locales/en/about.json';
import banner from 'locales/en/banner.json';
import common from 'locales/en/common.json';
import match3rd from 'locales/en/match3rd.json';
import query3rd from 'locales/en/query3rd.json';

function StudentsPage(props: PageProps): JSX.Element {
  usePage({ name: 'Students Landing' });

  return (
    <Page
      title='Find your perfect volunteer tutor or mentor - Tutorbook'
      description='Looking for a tutor or mentor? Tutorbook connects you with qualified volunteer tutors and expert mentors, all for free. Book your first meeting today.'
      intercom
      {...props}
    >
      <TabHeader
        tabs={[
          {
            label: 'Organizations',
            href: '/',
          },
          {
            label: 'Students',
            active: true,
            href: '/students',
          },
        ]}
      />
      <Hero />
      <Students />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(StudentsPage, {
  common,
  about,
  banner,
  query3rd,
  match3rd,
});
