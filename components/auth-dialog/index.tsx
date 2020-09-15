import { useCallback, useState, FormEvent } from 'react';
import { Dialog } from '@rmwc/dialog';
import { TextFieldHelperText } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';

import Button from 'components/button';
import Loader from 'components/loader';

import { OrgJSON } from 'lib/model';
import { signupWithGoogle } from 'lib/account/signup';

import styles from './auth-dialog.module.scss';

export interface AuthDialogProps {
  org?: OrgJSON;
}

export default function AuthDialog({ org }: AuthDialogProps): JSX.Element {
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  const onClick = useCallback(async () => {
    setError(undefined);
    setLoggingIn(true);
    const [err] = await to(signupWithGoogle());
    if (err) {
      setLoggingIn(false);
      setError(err);
    } else {
      setLoggingIn(false);
    }
  }, []);
  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      return onClick();
    },
    [onClick]
  );

  const { t } = useTranslation();

  return (
    <Dialog open preventOutsideDismiss>
      <div className={styles.wrapper}>
        <Loader active={loggingIn} />
        <div className={styles.nav}>
          {t('search:login-header', { name: org ? org.name : 'Organization' })}
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <p className={styles.body}>
            {t('search:login-body', { name: org ? org.name : 'Organization' })}
          </p>
          <Button
            className={styles.btn}
            onClick={onClick}
            label={t('login:google')}
            disabled={loggingIn}
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
        </form>
      </div>
    </Dialog>
  );
}
