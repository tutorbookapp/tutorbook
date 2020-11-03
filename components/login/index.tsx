import { useCallback, useEffect, useState } from 'react';
import { TextFieldHelperText } from '@rmwc/textfield';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';
import Router from 'next/router';

import Button from 'components/button';

import { useUser } from 'lib/context/user';
import { signupWithGoogle } from 'lib/firebase/signup';
import Link from 'lib/intl/link';

import styles from './login.module.scss';

export default function Login(): JSX.Element {
  const { loggedIn } = useUser();

  const { t } = useTranslation();
  const [error, setError] = useState<Error>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [redirect, setRedirect] = useState<string>('/dashboard');

  useEffect(() => {
    // TODO: Ideally, we'd be able to use Next.js's `useRouter` hook to get the
    // URL query parameters, but right now, it doesn't seem to be working.
    // @see {@link https://github.com/vercel/next.js/issues/17112}
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setRedirect((prev) => decodeURIComponent(params.get('href') || prev));
  }, []);
  useEffect(() => {
    if (loggedIn) {
      void Router.push(redirect);
    }
  }, [redirect, loggedIn]);
  useEffect(() => {
    void Router.prefetch(redirect);
  }, [redirect]);

  const onClick = useCallback(async () => {
    setError(undefined);
    setSubmitting(true);
    const [err] = await to(signupWithGoogle());
    if (err) {
      setSubmitting(false);
      setError(err);
    } else {
      await Router.push(redirect);
      setSubmitting(false);
    }
  }, [redirect]);

  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('login:title')}</h1>
        <div className={styles.buttons}>
          <Button
            onClick={onClick}
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
              {t('login:error', { error: error.message })}
            </TextFieldHelperText>
          )}
        </div>
      </div>
      <div className={styles.signup}>
        <Link href='/default/signup'>
          <a className={styles.link}>{t('login:signup')}</a>
        </Link>
      </div>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}
