import { useRouter } from 'next/router';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';

function AwaitingConfirmPage(): JSX.Element {
  const { query } = useRouter();

  usePage({ name: 'Awaiting Confirmation' });

  return (
    <Page title='Awaiting Confirmation - Tutorbook' intercom>
      <EmptyHeader />
      <Notification header='Awaiting Confirmation'>
        <p>
          We just sent an email to{' '}
          <b>{query.email || 'your-email@domain.com'}</b>.
        </p>
        <p>Click the confirmation button in that email to continue.</p>
      </Notification>
    </Page>
  );
}

export default withI18n(AwaitingConfirmPage, { common });
