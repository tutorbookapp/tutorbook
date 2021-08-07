import { FormEvent, useCallback } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import { Org } from 'lib/model/org';

import styles from './settings.module.scss';
import { useSettings } from './context';

export default function Signup(): JSX.Element {
  const { t, lang: locale } = useTranslation();
  const { org, setOrg } = useSettings();

  const onHeaderChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const header = evt.currentTarget.value;
      setOrg((prev: Org) => {
        const signup = {
          ...prev.signup,
          [locale]: { ...prev.signup[locale], header },
        };
        return new Org({ ...prev, signup });
      });
    },
    [locale, setOrg]
  );
  const onBodyChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const body = evt.currentTarget.value;
      setOrg((prev: Org) => {
        const signup = {
          ...prev.signup,
          [locale]: { ...prev.signup[locale], body },
        };
        return new Org({ ...prev, signup });
      });
    },
    [locale, setOrg]
  );
  const onBioChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const bio = evt.currentTarget.value;
      setOrg((prev: Org) => {
        const signup = {
          ...prev.signup,
          [locale]: { ...prev.signup[locale], bio },
        };
        return new Org({ ...prev, signup });
      });
    },
    [locale, setOrg]
  );

  return (
    <div className={styles.card}>
      <div className={styles.inputs}>
        <TextField
          label={t('org:signup-header')}
          placeholder={t('org:signup-header-placeholder')}
          value={(org.signup[locale] || {}).header || ''}
          onChange={onHeaderChange}
          className={styles.field}
          outlined
          required
        />
        <TextField
          label={t('org:signup-body')}
          placeholder={t('org:signup-body-placeholder')}
          value={(org.signup[locale] || {}).body || ''}
          onChange={onBodyChange}
          className={styles.field}
          outlined
          required
          rows={8}
          textarea
        />
        <TextField
          label={t('org:signup-bio')}
          placeholder={t('org:signup-bio-placeholder')}
          value={(org.signup[locale] || {}).bio || ''}
          onChange={onBioChange}
          className={styles.field}
          outlined
          required
          rows={8}
          textarea
        />
      </div>
    </div>
  );
}
