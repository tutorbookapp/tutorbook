import { EmptyHeader } from 'components/navigation';
import Login from 'components/login';
import Page from 'components/page';

import { PageProps, getPageProps } from 'lib/page';
import useLoginPage from 'lib/hooks/login-page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import login from 'locales/en/login.json';

function LoginPage(props: PageProps): JSX.Element {
  useLoginPage('Login');

  return (
    <Page
      title='Login - Tutorbook'
      description='Welcome to Tutorbook. Login with Google or email to manage your organization, onboard volunteers, match students, schedule lessons, and scale your tutoring programs.'
      {...props}
    >
      <EmptyHeader />
      <Login />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(LoginPage, { common, login });
