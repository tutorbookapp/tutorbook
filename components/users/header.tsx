import { memo, useCallback, useState } from 'react';
import { Snackbar } from '@rmwc/snackbar';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';

import Intercom from 'lib/intercom';
import TitleHeader from 'components/header';

export interface HeaderProps {
  orgId: string;
  orgName: string;
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
    console.error('Oops, unable to copy to clipboard.');
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
}: HeaderProps): JSX.Element {
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
    return Intercom('showNewMessage', t('users:import-data-msg'));
  }, [t]);

  return (
    <>
      {snackbar && (
        <Snackbar
          onClose={hideSnackbar}
          message={t('users:link-copied')}
          dismissIcon
          leading
          open
        />
      )}
      <TitleHeader
        header={t('common:users')}
        body={t('users:subtitle', { name: orgName ? `${orgName}'s` : 'your' })}
        actions={[
          {
            label: t('users:share-signup-link'),
            onClick: copySignupLink,
          },
          {
            label: t('users:share-search-link'),
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
