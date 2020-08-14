import { useCallback, useEffect, useState } from 'react';
import { TextFieldHelperText } from '@rmwc/textfield';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';
import Router from 'next/router';

import Button from 'components/button';

import { useUser } from 'lib/account';
import { signupWithGoogle } from 'lib/account/signup';
import Link from 'lib/intl/link';

import styles from './login.module.scss';

export default function Login(): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (user.id) {
      void Router.push('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    void Router.prefetch('/dashboard');
  }, []);

  const handleClick = useCallback(async () => {
    setSubmitting(true);
    const [err] = await to(signupWithGoogle());
    if (err) {
      setSubmitting(false);
      setError(
        `An error occurred while logging in with Google. ${err.message}`
      );
    } else {
      await Router.push('/dashboard');
      setSubmitting(false);
    }
  }, []);

  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('login:title')}</h1>
        <div className={styles.buttons}>
          <Button
            onClick={handleClick}
            label={t('login:google')}
            disabled={submitting}
            google
            raised
            arrow
          />
          {!!error && (
            <TextFieldHelperText
              persistent
              validationMsg
              className={styles.error}
            >
              {error}
            </TextFieldHelperText>
          )}
        </div>
      </div>
      <div className={styles.signup}>
        <Link href='/signup'>
          <a className={styles.link}>{t('login:signup')}</a>
        </Link>
      </div>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}
