import NotificationPage from 'components/notification';

export default function AuthenticationFailedPage(): JSX.Element {
  return (
    <NotificationPage header='Authentication Failed'>
      <p>
        It looks like you may have clicked on an invalid email verification
        link.
      </p>
      <p>Please close this window and try authenticating again.</p>
    </NotificationPage>
  );
}
