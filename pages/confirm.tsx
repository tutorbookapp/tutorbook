import NProgress from 'nprogress';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import { mutate } from 'swr';
import to from 'await-to-js';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import NotificationPage from 'components/notification';

import { User, UserJSON } from 'lib/model';

export default function Confirm(): JSX.Element {
  const { query, push } = useRouter();

  useEffect(() => {
    NProgress.start();
  }, []);

  useEffect(() => {
    async function error(): Promise<void> {
      await push('/notifications/authentication-failed');
    }

    async function signupWithEmail(): Promise<void> {
      const { default: firebase } = await import('lib/firebase');
      await import('firebase/auth');

      const auth = firebase.auth();
      if (!auth.isSignInWithEmailLink(window.location.href)) return error();
      const email = localStorage.getItem('email');
      if (!email) return error();
      const [signInErr, cred] = await to(auth.signInWithEmailLink(email));
      if (signInErr || !cred?.user) return error();
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
      if (createErr || !res) return error();
      if (!dequal(res.data, user.toJSON())) {
        await mutate('/api/account', res.data, false);
      }

      await push(decodeURIComponent((query.href as string) || 'dashboard'));
      return localStorage.removeItem('email');
    }

    void signupWithEmail();
  }, [query, push]);

  return <NotificationPage header='Confirming Login' />;
}
