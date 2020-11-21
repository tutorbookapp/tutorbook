import { memo, useCallback, useState } from 'react';
import { Snackbar } from '@rmwc/snackbar';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';

import Intercom from 'lib/intercom';
import TitleHeader from 'components/header';

import { TCallback, User, UserJSON } from 'lib/model';

import styles from './header.module.scss';

export interface HeaderProps {
  orgId: string;
  orgName: string;
  setViewing: TCallback<UserJSON | undefined>;
}

function fallbackCopyTextToClipboard(text: string): void {
  const textArea = document.createElement('textarea');

  textArea.value = text;
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);

  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) return fallbackCopyTextToClipboard(text);
  const [err] = await to(navigator.clipboard.writeText(text));
  if (err) return fallbackCopyTextToClipboard(text);
}

export default memo(function Header({
  orgId,
  orgName,
  setViewing,
}: HeaderProps): JSX.Element {
  const createUser = useCallback(() => {
    setViewing(new User({ orgs: [orgId] }).toJSON());
  }, [setViewing, orgId]);

  const [snackbar, setSnackbar] = useState<boolean>(false);
  const hideSnackbar = useCallback(() => setSnackbar(false), []);
  const copySignupLink = useCallback(async () => {
    await copyTextToClipboard(
      `${window.location.protocol}//${window.location.host}/${orgId}/signup`
    );
    setSnackbar(true);
  }, [orgId]);
  const copySearchLink = useCallback(async () => {
    await copyTextToClipboard(
      `${window.location.protocol}//${window.location.host}/${orgId}/search`
    );
    setSnackbar(true);
  }, [orgId]);

  const { t } = useTranslation();
  const importData = useCallback(() => {
    return Intercom('showNewMessage', t('people:import-data-msg'));
  }, [t]);

  return (
    <>
      {snackbar && (
        <Snackbar
          className={styles.snackbar}
          onClose={hideSnackbar}
          message={t('people:link-copied')}
          dismissIcon
          leading
          open
        />
      )}
      <TitleHeader
        header={t('common:people')}
        body={t('people:subtitle', { name: orgName })}
        actions={[
          {
            label: t('people:create-user'),
            onClick: createUser,
          },
          {
            label: t('people:share-signup-link'),
            onClick: copySignupLink,
          },
          {
            label: t('people:share-search-link'),
            onClick: copySearchLink,
          },
          {
            label: t('common:import-data'),
            onClick: importData,
          },
        ]}
      />
    </>
  );
});
