import { EmptyHeader } from 'components/navigation';
import Page from 'components/page';

import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';

import styles from './notification.module.scss';

export interface NotificationProps {
  header: string;
  intercom?: boolean;
  children?: React.ReactNode;
}

function Notification({
  header,
  intercom,
  children,
}: NotificationProps): JSX.Element {
  return (
    <Page title={`${header} - Tutorbook`} intercom={intercom}>
      <EmptyHeader />
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <h3>{header}</h3>
          {children}
        </div>
      </div>
    </Page>
  );
}

export default withI18n(Notification, { common });
