import Login from 'components/login';
import Page from 'components/page';
import { EmptyHeader } from 'components/navigation';

import { withI18n } from 'lib/intl';

import login from 'locales/en/login.json';
import common from 'locales/en/common.json';

function LoginPage(): JSX.Element {
  return (
    <Page title='Login - Tutorbook'>
      <EmptyHeader />
      <Login />
    </Page>
  );
}

export default withI18n(LoginPage, { common, login });
