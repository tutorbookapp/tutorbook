import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';

function AuthenticationFailedPage(): JSX.Element {
  usePage({ name: 'Authenticated Failed' });

  return (
    <Page title='Authentication Failed - Tutorbook' intercom>
      <EmptyHeader />
      <Notification header='Authentication Failed'>
        <p>
          It looks like you may have clicked on an invalid email verification
          link.
        </p>
        <p>Please close this window and try authenticating again.</p>
      </Notification>
    </Page>
  );
}

export default withI18n(AuthenticationFailedPage, { common });
