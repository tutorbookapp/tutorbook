import { FormEvent, memo, useCallback, useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { IconButton } from '@rmwc/icon-button';
import { TextFieldHelperText } from '@rmwc/textfield';
import { mutate } from 'swr';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import Loader from 'components/loader';
import Inputs from 'components/inputs/user';
import Button from 'components/button';

import { TCallback, User, UserJSON } from 'lib/model';
import Utils from 'lib/utils';

import styles from './edit-page.module.scss';

export interface EditPageProps {
  value: UserJSON;
  onChange: TCallback<UserJSON>;
  openDisplay: () => Promise<void>;
}

export default memo(function EditPage({
  value,
  onChange,
  openDisplay,
}: EditPageProps): JSX.Element {
  // We maintain internal state and only call the given `mutate` callback once
  // the user clicks the create/update button and our API responds.
  const [user, setUser] = useState<User>(User.fromJSON(value));
  const [checked, setChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => setUser(User.fromJSON(value)), [value]);

  useEffect(() => setError((prev: string) => Utils.period(prev)), [error]);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setChecked(false);
      setLoading(true);
      if (user.id.startsWith('temp')) {
        const [err, res] = await to(
          axios.post<UserJSON>('/api/users', {
            user: { ...user, id: '' },
          })
        );
        if (err) {
          setError(`An error occurred while creating user. ${err.message}`);
          setLoading(false);
        } else {
          onChange((res as AxiosResponse<UserJSON>).data);
          setChecked(true);
          setTimeout(() => {
            void openDisplay().then(() => setLoading(false));
          }, 1000);
        }
      } else {
        const url = `/api/users/${user.id}`;
        const [err, res] = await to(axios.put<UserJSON>(url, user));
        if (err) {
          setError(`An error occurred while updating user. ${err.message}`);
          setLoading(false);
        } else {
          onChange((res as AxiosResponse<UserJSON>).data);
          setChecked(true);
          setTimeout(() => {
            void openDisplay().then(() => setLoading(false));
          }, 1000);
        }
      }
    },
    [onChange, openDisplay, user]
  );

  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputs}>
          <Inputs
            value={user}
            onChange={setUser}
            className={styles.field}
            renderToPortal
            name
            email
            phone
            photo
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <Inputs
            value={user}
            onChange={setUser}
            className={styles.field}
            renderToPortal
            bio
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <Inputs
            value={user}
            onChange={setUser}
            className={styles.field}
            renderToPortal
            mentoringSubjects
            mentoringSearches
            tutoringSubjects
            tutoringSearches
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <Inputs
            value={user}
            onChange={setUser}
            className={styles.field}
            renderToPortal
            socials
          />
          <Button
            className={styles.btn}
            label={t(
              user.id.startsWith('temp') ? 'user:create-btn' : 'user:update-btn'
            )}
            disabled={loading}
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
      </form>
    </div>
  );
});
