import { useRouter } from 'next/router';

import NotificationPage from 'components/notification';

import { usePage } from 'lib/hooks';

export default function AwaitingConfirmPage(): JSX.Element {
  const {
    query: { email },
  } = useRouter();
  usePage('Awaiting Confirmation');

  return (
    <NotificationPage header='Awaiting Confirmation' intercom>
      <p>
        We just sent an email to <b>{email}</b>.
      </p>
      <p>Click the confirmation button in that email to continue.</p>
    </NotificationPage>
  );
}
