import { memo, useCallback, useState } from 'react';
import { Snackbar } from '@rmwc/snackbar';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';

import TitleHeader from 'components/header';

import { Callback } from 'lib/model/callback';

export interface HeaderProps {
  orgId: string;
  orgName: string;
  setDialogOpen: Callback<boolean>;
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

function Header({ orgId, orgName, setDialogOpen }: HeaderProps): JSX.Element {
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

  // TODO: Once the types are updated, restore the snackbar's SVG dismiss icon.
  // @see {@link https://github.com/jamesmfriedman/rmwc/pull/727}

  return (
    <>
      {snackbar && (
        <Snackbar
          onClose={hideSnackbar}
          message={t('users:link-copied')}
          leading
          open
        />
      )}
      <TitleHeader
        header={t('common:users')}
        body={t('users:subtitle', { name: orgName ? `${orgName}'s` : 'your' })}
        actions={[
          {
            label: 'Create user',
            onClick: () => setDialogOpen(true),
          },
          {
            label: t('users:share-signup-link'),
            onClick: copySignupLink,
          },
          {
            label: t('users:share-search-link'),
            onClick: copySearchLink,
          },
        ]}
      />
    </>
  );
}

export default memo(Header);
