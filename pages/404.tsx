import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { PageProps, getPageProps } from 'lib/page';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import error from 'locales/en/error.json';

function Custom404Page(props: PageProps): JSX.Element {
  const { t } = useTranslation();

  usePage({ name: '404' });

  return (
    <Page title={`${t('error:404-header')} - Tutorbook`} intercom {...props}>
      <EmptyHeader />
      <Notification header={t('error:404-header')}>
        <p>{t('error:404-body')}</p>
      </Notification>
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(Custom404Page, { common, error });
