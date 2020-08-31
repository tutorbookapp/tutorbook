import { useCallback, FormEvent } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import PhotoInput from 'components/photo-input';

import { Org } from 'lib/model';

import { useSettings } from './context';
import styles from './settings.module.scss';

export default function Home(): JSX.Element {
  const { t, lang: locale } = useTranslation();
  const { org, setOrg } = useSettings();

  const onSubmit = useCallback((evt: FormEvent) => evt.preventDefault(), []);
  const onPhotoChange = useCallback(
    (photo: string) => {
      setOrg((prev: Org) => {
        const home = {
          ...prev.home,
          [locale]: { ...prev.home[locale], photo },
        };
        return new Org({ ...prev, home });
      });
    },
    [locale, setOrg]
  );
  const onHeaderChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const header = evt.currentTarget.value;
      setOrg((prev: Org) => {
        const home = {
          ...prev.home,
          [locale]: { ...prev.home[locale], header },
        };
        return new Org({ ...prev, home });
      });
    },
    [locale, setOrg]
  );
  const onBodyChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const body = evt.currentTarget.value;
      setOrg((prev: Org) => {
        const home = { ...prev.home, [locale]: { ...prev.home[locale], body } };
        return new Org({ ...prev, home });
      });
    },
    [locale, setOrg]
  );

  return (
    <div className={styles.card}>
      <form onSubmit={onSubmit}>
        <div className={styles.inputs}>
          <PhotoInput
            label={t('org:home-photo')}
            value={org.home[locale].photo || ''}
            onChange={onPhotoChange}
            className={styles.field}
            outlined
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <TextField
            label={t('org:home-header')}
            placeholder={t('org:home-header-placeholder')}
            value={org.home[locale].header}
            onChange={onHeaderChange}
            className={styles.field}
            outlined
            required
          />
          <TextField
            label={t('org:home-body')}
            placeholder={t('org:home-body-placeholder')}
            value={org.home[locale].body}
            onChange={onBodyChange}
            className={styles.field}
            outlined
            required
            rows={8}
            textarea
          />
        </div>
      </form>
    </div>
  );
}
