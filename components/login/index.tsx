import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Router, { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import NProgress from 'nprogress';
import { TextField } from '@rmwc/textfield';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';

import { APIErrorJSON } from 'lib/api/error';
import getLocation from 'lib/utils/location';
import { signupWithGoogle } from 'lib/firebase/signup';
import { useUser } from 'lib/context/user';

import styles from './login.module.scss';

export default function Login(): JSX.Element {
  const { loggedIn } = useUser();

  const { t } = useTranslation();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { query } = useRouter();
  const redirect = useMemo(
    () => decodeURIComponent((query.href as string) || 'dashboard'),
    [query]
  );
  useEffect(() => {
    if (loggedIn) {
      void Router.push(redirect);
    }
  }, [redirect, loggedIn]);
  useEffect(() => {
    void Router.prefetch(redirect);
  }, [redirect]);

  useEffect(() => {
    if (!loading) {
      NProgress.done();
    } else {
      NProgress.start();
      setError('');
    }
  }, [loading]);
  useEffect(() => {
    if (error) setLoading(false);
  }, [error]);

  const [email, setEmail] = useState<string>('');
  const loginWithEmail = useCallback(
    async (evt: FormEvent) => {
      evt.preventDefault();
      setLoading(true);
      localStorage.setItem('email', email);
      const [locationErr, location] = await to(getLocation());
      if (locationErr) return setError(locationErr.message);
      const [err] = await to(
        axios.post('/api/login', { email, location, redirect })
      );
      if (err) {
        const e = (err as AxiosError<APIErrorJSON>).response?.data || err;
        return setError(e.message);
      }
      return Router.push(`/notifications/awaiting-confirm?email=${email}`);
    },
    [email, redirect]
  );

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    const [err] = await to(signupWithGoogle());
    if (err) return setError(err.message);
    return Router.push(redirect);
  }, [redirect]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h2>Welcome</h2>
        <Button
          onClick={loginWithGoogle}
          label='Continue with Google'
          disabled={loading}
          google
          raised
          arrow
        />
        <div className={styles.divider}>
          <span>Or, sign in with your email</span>
        </div>
        <form onSubmit={loginWithEmail}>
          <TextField
            label='Your email address'
            placeholder='Ex: you@domain.com'
            disabled={loading}
            value={email}
            onChange={(evt) => setEmail(evt.currentTarget.value)}
            type='email'
            required
            outlined
          />
          <Button label='Continue with Email' disabled={loading} raised arrow />
        </form>
        {!!error && (
          <div className={styles.error}>{t('login:error', { error })}</div>
        )}
      </div>
    </div>
  );
}
