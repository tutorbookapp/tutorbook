import { NextPageContext } from 'next';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import error from 'locales/en/error.json';

interface ErrorPageProps {
  status?: number;
  message?: string;
}

function ErrorPage({ status, message }: ErrorPageProps): JSX.Element {
  const { t } = useTranslation();
  const header = useMemo(() => {
    if (typeof status === 'number' && [404, 400, 405, 500].includes(status))
      return t(`error:${status}-header`);
    return t('error:header');
  }, [t, status]);

  return (
    <Page title={`${header} - Tutorbook`} intercom>
      <EmptyHeader />
      <Notification header={header}>
        <p>{message || t('error:body')}</p>
      </Notification>
    </Page>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const status = res?.statusCode || err?.statusCode;
  return { status, message: err?.message };
};

export default withI18n(ErrorPage, { common, error });
