import NotificationPage from 'components/notification';

import { usePage } from 'lib/hooks';

export default function AuthenticationFailedPage(): JSX.Element {
  usePage('Authenticated Failed');

  return (
    <NotificationPage header='Authentication Failed' intercom>
      <p>
        It looks like you may have clicked on an invalid email verification
        link.
      </p>
      <p>Please close this window and try authenticating again.</p>
    </NotificationPage>
  );
}
