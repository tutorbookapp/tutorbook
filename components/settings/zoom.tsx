import { useCallback, FormEvent } from 'react';
import { FormField } from '@rmwc/formfield';
import { Switch } from '@rmwc/switch';
import useTranslation from 'next-translate/useTranslation';
import Trans from 'next-translate/Trans';

import styles from './settings.module.scss';

export default function Zoom(): JSX.Element {
  const { t } = useTranslation();

  const onSubmit = useCallback((evt: FormEvent) => evt.preventDefault(), []);

  return (
    <div className={styles.card}>
      <form onSubmit={onSubmit}>
        <div className={styles.inputs}>
          <FormField className={styles.field}>
            <label className={styles.label} htmlFor='zoom-users'>
              <p>
                <b>{t('zoom:users-header')}</b>
              </p>
              <p>{t('zoom:users-body')}</p>
              <p>
                <Trans i18nKey='zoom:users-scopes' components={[<b />]} />
              </p>
            </label>
            <Switch id='zoom-users' />
          </FormField>
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <FormField className={styles.field}>
            <label className={styles.label} htmlFor='zoom-meetings'>
              <p>
                <b>{t('zoom:meetings-header')}</b>
              </p>
              <p>{t('zoom:meetings-body')}</p>
              <p>
                <Trans i18nKey='zoom:meetings-scopes' components={[<b />]} />
              </p>
            </label>
            <Switch id='zoom-meetings' />
          </FormField>
        </div>
        <footer className={styles.footer}>
          <div className={styles.content}>
            <Trans
              i18nKey='zoom:learn-more'
              components={[
                <a href='https://github.com/tutorbookapp/tutorbook#zoom-integrations' />,
              ]}
            />
          </div>
        </footer>
      </form>
    </div>
  );
}
