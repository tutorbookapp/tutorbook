import React, { memo, useState, useCallback } from 'react';
import Inputs from 'components/volunteer-form/inputs';
import Button from 'components/button';
import Loader from 'components/loader';
import { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';
import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';

import { TextFieldHelperText } from '@rmwc/textfield';
import { IconButton } from '@rmwc/icon-button';
import { UserJSON, Callback } from 'lib/model';

import styles from './edit-page.module.scss';

export interface EditPageProps {
  value: UserJSON;
  onChange: Callback<UserJSON>;
  openDisplay: () => Promise<void>;
}

export default memo(function EditPage({
  value,
  onChange,
  openDisplay,
}: EditPageProps): JSX.Element {
  // We maintain internal state and only call the given `mutate` callback once
  // the user clicks the create/update button and our API responds.
  const [user, setUser] = useState<UserJSON>(value);
  const [checked, setChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const onUserChange = useCallback((updated: UserJSON) => setUser(updated), []);
  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setChecked(false);
      setLoading(true);
      if (user.id.startsWith('temp')) {
        const url = '/api/users';
        const [err, res] = await to(
          axios.post<UserJSON>(url, {
            user: { ...user, id: '' },
          })
        );
        if (err) {
          setError(`An error occurred while creating user. ${err.message}`);
        } else {
          onChange((res as AxiosResponse<UserJSON>).data);
        }
      } else {
        const url = `/api/users/${user.id}`;
        const [err, res] = await to(axios.put<UserJSON>(url, user));
        if (err) {
          setError(`An error occurred while updating user. ${err.message}`);
        } else {
          onChange((res as AxiosResponse<UserJSON>).data);
        }
      }
      setChecked(true);
      // Wait 1.2secs to show checkmark animation before hiding the loading
      // overlay and letting the user edit their newly created/updated user.
      setTimeout(() => openDisplay().then(() => setLoading(false)), 1000);
    },
    [openDisplay, mutate, user]
  );

  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <div className={styles.content}>
        <form className={styles.form} onSubmit={onSubmit}>
          <Inputs value={user} onChange={onUserChange} />
          <Button
            className={styles.btn}
            label={t(
              user.id.startsWith('temp')
                ? 'signup:create-btn'
                : `signup:update-btn`
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
        </form>
      </div>
    </div>
  );
});
