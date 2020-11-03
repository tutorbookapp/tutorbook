import { useCallback, useState } from 'react';
import { Dialog } from '@rmwc/dialog';
import { TextFieldHelperText } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';

import Button from 'components/button';
import Loader from 'components/loader';

import { User } from 'lib/model';
import { join } from 'lib/utils';
import { signupWithGoogle } from 'lib/firebase/signup';
import { useOrg } from 'lib/context/org';

import styles from './auth-dialog.module.scss';

export default function AuthDialog(): JSX.Element {
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  const { org } = useOrg();

  const onClick = useCallback(async () => {
    setError(undefined);
    setLoggingIn(true);
    const user = new User({ orgs: org ? [org.id] : ['default'] });
    const gsuite = !!org && !!org.domains.length;
    const [err] = await to(signupWithGoogle(user, gsuite));
    if (err) {
      setLoggingIn(false);
      setError(err);
    } else {
      setLoggingIn(false);
    }
  }, [org]);

  const { t } = useTranslation();

  return (
    <Dialog open preventOutsideDismiss>
      <div className={styles.wrapper}>
        <Loader active={loggingIn} />
        <div className={styles.nav}>
          {t('search:login-header', { name: org ? org.name : 'Organization' })}
        </div>
        <div className={styles.form}>
          <p className={styles.body}>
            {t('search:login-body', {
              name: org ? org.name : 'this organization',
              domains: org
                ? join(
                    org.domains.map((domain) => `@${domain}`),
                    'or'
                  )
                : 'organization',
            })}
          </p>
          <Button
            className={styles.btn}
            onClick={onClick}
            label={t('search:login-btn')}
            disabled={loggingIn}
            google
            raised
            arrow
          />
          {!!error && (
            <TextFieldHelperText
              data-cy='error'
              persistent
              validationMsg
              className={styles.error}
            >
              {t('search:login-err', { error: error.message })}
            </TextFieldHelperText>
          )}
        </div>
      </div>
    </Dialog>
  );
}
