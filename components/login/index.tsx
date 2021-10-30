import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Router, { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import NProgress from 'nprogress';
import { TextField } from '@rmwc/textfield';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';

import { APIErrorJSON } from 'lib/model/error';
import getLocation from 'lib/utils/location';
import { loginWithGoogle } from 'lib/firebase/login';
import { period } from 'lib/utils';
import useTrack from 'lib/hooks/track';

import styles from './login.module.scss';

export default function Login(): JSX.Element {
  const { query } = useRouter();
  const { t } = useTranslation();

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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

  const track = useTrack();
  const redirect = useMemo(
    () => decodeURIComponent((query.href as string) || 'overview'),
    [query.href]
  );

  const [email, setEmail] = useState<string>('');
  const withEmail = useCallback(
    async (evt: FormEvent) => {
      evt.preventDefault();
      setLoading(true);
      localStorage.setItem('email', email);
      track('Email Login Started', { email });
      const [locationErr, location] = await to(getLocation());
      if (locationErr) {
        track('Email Login Errored', { error: period(locationErr.message) });
        return setError(period(locationErr.message));
      }
      const [err] = await to(
        axios.post('/api/login', { email, location, redirect })
      );
      if (err) {
        const e = (err as AxiosError<APIErrorJSON>).response?.data || err;
        track('Email Login Errored', { error: period(e.message) });
        return setError(period(e.message));
      }
      return Router.push({
        pathname: '/awaiting-confirm',
        query: { email, href: query.href },
      });
    },
    [track, email, redirect, query.href]
  );

  const withGoogle = useCallback(async () => {
    setLoading(true);
    track('Google Login Started');
    const [err] = await to(loginWithGoogle());
    if (err) {
      track('Google Login Errored', { error: period(err.message) });
      return setError(period(err.message));
    }
    return Router.push(redirect);
  }, [track, redirect]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h2>Welcome</h2>
        <Button
          onClick={withGoogle}
          label='Continue with Google'
          disabled={loading}
          google
          raised
          arrow
        />
        <div className={styles.divider}>
          <span>Or, sign in with your email</span>
        </div>
        <form onSubmit={withEmail}>
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
          <Button label='Continue with email' disabled={loading} raised arrow />
        </form>
        {!!error && (
          <div data-cy='error' className={styles.error}>
            {t('login:error', { error })}
          </div>
        )}
      </div>
    </div>
  );
}
