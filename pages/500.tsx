import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { PageProps, getPageProps } from 'lib/page';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import error from 'locales/en/error.json';

function Custom500Page(props: PageProps): JSX.Element {
  const { t } = useTranslation();

  usePage('500');

  return (
    <Page title={`${t('error:500-header')} - Tutorbook`} intercom {...props}>
      <EmptyHeader />
      <Notification header={t('error:500-header')}>
        <p>{t('error:500-body')}</p>
      </Notification>
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(Custom500Page, { common, error });
