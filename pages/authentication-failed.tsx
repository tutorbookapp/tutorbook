import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { period } from 'lib/utils';
import { useLoginPage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import auth from 'locales/en/auth.json';
import common from 'locales/en/common.json';

function AuthenticationFailedPage(): JSX.Element {
  const { query } = useRouter();
  const { t } = useTranslation();

  useLoginPage({ name: 'Authenticated Failed' });

  return (
    <Page title='Authentication Failed - Tutorbook' intercom>
      <EmptyHeader />
      <Notification header={t('auth:header')}>
        <p>
          {typeof query.error === 'string'
            ? period(decodeURIComponent(query.error))
            : t('auth:placeholder')}
        </p>
        <p>{t('auth:prompt')}</p>
      </Notification>
    </Page>
  );
}

export default withI18n(AuthenticationFailedPage, { auth, common });
