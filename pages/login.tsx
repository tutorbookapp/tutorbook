import { EmptyHeader } from 'components/navigation';
import Login from 'components/login';
import Page from 'components/page';

import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import login from 'locales/en/login.json';

function LoginPage(): JSX.Element {
  usePage({ name: 'Login' });

  return (
    <Page title='Login - Tutorbook'>
      <EmptyHeader />
      <Login />
    </Page>
  );
}

export default withI18n(LoginPage, { common, login });
