import NProgress from 'nprogress';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import { mutate } from 'swr';
import to from 'await-to-js';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { User, UserJSON } from 'lib/model';
import { usePage, useTrack } from 'lib/hooks';
import { period } from 'lib/utils';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import confirm from 'locales/en/confirm.json';

function ConfirmPage(): JSX.Element {
  const { query, push } = useRouter();
  const { t } = useTranslation();

  usePage({ name: 'Confirm' });

  const track = useTrack();

  useEffect(() => {
    let canceled = false;

    async function error(msg: string): Promise<void> {
      if (canceled) return;
      track('Email Login Errored', { error: period(msg) });
      await push(`/authentication-failed?error=${encodeURIComponent(msg)}`);
    }

    async function signupWithEmail(): Promise<void> {
      NProgress.start();

      const { default: firebase } = await import('lib/firebase');
      await import('firebase/auth');

      const auth = firebase.auth();
      if (!auth.isSignInWithEmailLink(window.location.href))
        return error(t('confirm:invalid-link'));
      const email = localStorage.getItem('email');
      if (!email) return error(t('confirm:no-email'));
      const [signInErr, cred] = await to(auth.signInWithEmailLink(email));
      if (signInErr || !cred?.user) return error(signInErr?.message || '');
      const user = new User({
        id: cred.user.uid,
        name: cred.user.displayName as string,
        photo: cred.user.photoURL as string,
        email: cred.user.email as string,
        phone: cred.user.phoneNumber as string,
      });
      await mutate('/api/account', user.toJSON(), false);

      // Create the Firestore profile document (we cannot POST to `/api/users`
      // endpoint because the Firebase Authentication account already exists).
      const [createErr, res] = await to(
        axios.put<UserJSON>('/api/account', user.toJSON())
      );
      if (createErr || !res) return error(createErr?.message || '');
      if (!dequal(res.data, user.toJSON())) {
        await mutate('/api/account', res.data, false);
      }

      await push(decodeURIComponent((query.href as string) || 'overview'));
      return localStorage.removeItem('email');
    }

    void signupWithEmail();

    return () => {
      canceled = true;
    };
  }, [t, track, query, push]);

  return (
    <Page title='Confirming Login - Tutorbook'>
      <EmptyHeader />
      <Notification header={t('confirm:header')}>
        <p>{t('confirm:body')}</p>
      </Notification>
    </Page>
  );
}

export default withI18n(ConfirmPage, { common, confirm });
