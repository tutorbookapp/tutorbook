import Router, { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import { mutate } from 'swr';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Notification from 'components/notification';
import Page from 'components/page';

import { PageProps, getPageProps } from 'lib/page';
import { User, UserJSON } from 'lib/model';
import { useLoginPage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import confirm from 'locales/en/confirm.json';

function ConfirmPage(props: PageProps): JSX.Element {
  // TODO: Update or replace `next-translate` i18n solution because `t` keeps
  // changing which prevents us from using it in the `loginWithEmail` effect.
  const { t } = useTranslation();
  const { query } = useRouter();

  useLoginPage({ name: 'Confirm' });

  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!error) return;
    void Router.push({
      pathname: '/authentication-failed',
      query: { error, href: query.href },
    });
  }, [error, query.href]);

  useEffect(() => {
    // TODO: Abort if the page has been unmounted (so that we don't have state
    // updates on unmounted components). See: https://bit.ly/37Fp4WT
    async function loginWithEmail(): Promise<void> {
      const { default: firebase } = await import('lib/firebase');
      await import('firebase/auth');

      const auth = firebase.auth();
      if (!auth.isSignInWithEmailLink(window.location.href))
        return setError(confirm['invalid-link']);
      const email = localStorage.getItem('email');
      if (!email) return setError(confirm['no-email']);
      const [signInErr, cred] = await to(auth.signInWithEmailLink(email));
      if (signInErr || !cred?.user) return setError(signInErr?.message || '');
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
      if (createErr || !res) return setError(createErr?.message || '');
      if (!dequal(res.data, user.toJSON()))
        await mutate('/api/account', res.data, false);

      return localStorage.removeItem('email');
    }

    void loginWithEmail();
  }, []);

  return (
    <Page title='Confirming Login - Tutorbook' {...props}>
      <EmptyHeader />
      <Notification header={t('confirm:header')}>
        <p>{t('confirm:body')}</p>
      </Notification>
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(ConfirmPage, { common, confirm });
