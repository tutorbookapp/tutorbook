import NProgress from 'nprogress';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import { mutate } from 'swr';
import to from 'await-to-js';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { User, UserJSON } from 'lib/model';
import { usePage, useTrack } from 'lib/hooks';
import { period } from 'lib/utils';

export default function Confirm(): JSX.Element {
  const { query, push } = useRouter();

  usePage({ name: 'Confirm' });

  useEffect(() => {
    // Set a timeout to avoid conflicting with the page transition nprogress.
    const timeoutId = setTimeout(() => NProgress.start(), 200);
    return () => clearTimeout(timeoutId);
  }, []);

  const track = useTrack();

  useEffect(() => {
    async function error(msg: string): Promise<void> {
      track('Email Login Errored', { error: period(msg) });
      await push('/notifications/authentication-failed');
    }

    async function signupWithEmail(): Promise<void> {
      const { default: firebase } = await import('lib/firebase');
      await import('firebase/auth');

      const auth = firebase.auth();
      if (!auth.isSignInWithEmailLink(window.location.href))
        return error('Current URL was not a valid login link');
      const email = localStorage.getItem('email');
      if (!email) return error('No email found in local storage');
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

      await push(decodeURIComponent((query.href as string) || 'dashboard'));
      return localStorage.removeItem('email');
    }

    void signupWithEmail();
  }, [track, query, push]);

  return (
    <Page title='Confirming Login - Tutorbook'>
      <EmptyHeader />
      <Notification header='Confirming Login' />
    </Page>
  );
}
