import { EmptyHeader } from 'components/navigation';
import Login from 'components/login';
import Page from 'components/page';

import { useLoginPage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import login from 'locales/en/login.json';

function LoginPage(): JSX.Element {
  useLoginPage({ name: 'Login' });

  return (
    <Page
      title='Login - Tutorbook'
      description='Welcome to Tutorbook. Login with Google or email to manage your organization, onboard volunteers, match students, schedule lessons, and scale your tutoring and mentoring programs.'
    >
      <EmptyHeader />
      <Login />
    </Page>
  );
}

export default withI18n(LoginPage, { common, login });
