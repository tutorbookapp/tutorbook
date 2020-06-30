import React from 'react';
import Router from 'next/router';
import Button from 'components/button';

import { defMsg, useIntl, Msg, Link, IntlShape, IntlHelper } from 'lib/intl';
import { useUser } from 'lib/account';
import { signupWithGoogle } from 'lib/account/signup';
import { TextFieldHelperText } from '@rmwc/textfield';

import to from 'await-to-js';

import styles from './login.module.scss';

const msgs = defMsg({
  title: {
    id: 'login.title',
    defaultMessage: 'Login to Tutorbook',
  },
  google: {
    id: 'login.buttons.google',
    defaultMessage: 'Continue with Google',
  },
  signup: {
    id: 'login.signup',
    defaultMessage: "Don't have an account? Signup here.",
  },
});

export default function Login(): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (m: Msg, v?: any) => intl.formatMessage(m, v);
  const { user } = useUser();
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (user.id) {
      void Router.push('/[locale]/dashboard', `/${intl.locale}/dashboard`);
    }
  }, [user, intl.locale]);

  React.useEffect(() => {
    void Router.prefetch('/[locale]/dashboard', `/${intl.locale}/dashboard`);
  }, [intl.locale]);

  const handleClick = async () => {
    setSubmitting(true);
    const [err] = await to(signupWithGoogle());
    if (err) {
      setSubmitting(false);
      setError(
        `An error occurred while logging in with Google. ${err.message}`
      );
    } else {
      await Router.push('/[locale]/dashboard', `/${intl.locale}/dashboard`);
      setSubmitting(false);
    }
  };

  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h1 className={styles.title}>{msg(msgs.title)}</h1>
        <div className={styles.buttons}>
          <Button
            onClick={handleClick}
            label={msg(msgs.google)}
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
          <a className={styles.link}>{msg(msgs.signup)}</a>
        </Link>
      </div>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}
