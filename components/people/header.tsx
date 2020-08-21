import { memo, useCallback, useState } from 'react';
import { Snackbar } from '@rmwc/snackbar';
import useTranslation from 'next-translate/useTranslation';

import { IntercomAPI } from 'components/react-intercom';
import TitleHeader from 'components/header';

import { TCallback, User, UserJSON } from 'lib/model';

import styles from './header.module.scss';

export interface HeaderProps {
  orgId: string;
  orgName: string;
  setViewing: TCallback<UserJSON | undefined>;
}

export default memo(function Header({
  orgId,
  orgName,
  setViewing,
}: HeaderProps): JSX.Element {
  const createUser = useCallback(() => {
    setViewing(new User().toJSON());
  }, [setViewing]);

  const [snackbar, setSnackbar] = useState<boolean>(false);
  const hideSnackbar = useCallback(() => setSnackbar(false), []);
  const copySignupLink = useCallback(async () => {
    function fallbackCopyTextToClipboard(text: string): void {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Avoid scrolling to bottom
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
      return navigator.clipboard.writeText(text);
    }
    await copyTextToClipboard(
      `${window.location.protocol}//${window.location.host}/${orgId}`
    );
    setSnackbar(true);
  }, [orgId]);

  const { t } = useTranslation();
  const importData = useCallback(() => {
    return IntercomAPI('showNewMessage', t('people:import-data-msg'));
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
            label: t('common:import-data'),
            onClick: importData,
          },
        ]}
      />
    </>
  );
});
