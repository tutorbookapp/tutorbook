import { useCallback, FormEvent } from 'react';
import { Snackbar, SnackbarAction } from '@rmwc/snackbar';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';
import axios from 'axios';

import Header from 'components/header';
import PhotoInput from 'components/photo-input';

import { User, UserJSON } from 'lib/model';
import { useContinuous, useSocialProps } from 'lib/hooks';
import { useUser } from 'lib/context/user';

import styles from './profile.module.scss';

export default function Profile(): JSX.Element {
  const { t } = useTranslation();
  const { user: local, updateUser: updateLocal } = useUser();

  const updateRemote = useCallback(async (updated: User) => {
    const url = `/api/users/${updated.id}`;
    const { data } = await axios.put<UserJSON>(url, updated.toJSON());
    return User.fromJSON(data);
  }, []);

  const { error, retry, timeout, data: user, setData: setUser } = useContinuous<
    User
  >(local, updateRemote, updateLocal);

  const onNameChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const name = evt.currentTarget.value;
      setUser((prev: User) => new User({ ...prev, name }));
    },
    [setUser]
  );
  const onPhoneChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const phone = evt.currentTarget.value;
      setUser((prev: User) => new User({ ...prev, phone }));
    },
    [setUser]
  );
  const onPhotoChange = useCallback(
    (photo: string) => {
      setUser((prev: User) => new User({ ...prev, photo }));
    },
    [setUser]
  );
  const onBioChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const bio = evt.currentTarget.value;
      setUser((prev: User) => new User({ ...prev, bio }));
    },
    [setUser]
  );

  const getSocialProps = useSocialProps(user, setUser, styles.field, 'user3rd');

  return (
    <>
      {error && (
        <Snackbar
          className={styles.snackbar}
          message={t('profile:error', { count: timeout / 1000 })}
          timeout={-1}
          action={<SnackbarAction label={t('profile:retry')} onClick={retry} />}
          leading
          open
        />
      )}
      <Header
        header={t('common:profile')}
        body={t('profile:subtitle')}
        actions={[
          {
            label: t('profile:view-profile'),
            href: '/[org]/[[...slug]]',
            as: `/${user.orgs[0] || 'default'}/search/${user.id}`,
          },
        ]}
      />
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.inputs}>
            <TextField
              label={t('user3rd:name')}
              value={user.name}
              onChange={onNameChange}
              className={styles.field}
              required
              outlined
            />
            <TextField
              label={t('user3rd:email')}
              value={user.email}
              className={styles.field}
              type='email'
              disabled
              readOnly
              required
              outlined
            />
            <TextField
              label={t('user3rd:phone')}
              value={user.phone ? user.phone : undefined}
              onChange={onPhoneChange}
              className={styles.field}
              type='tel'
              outlined
            />
            <PhotoInput
              label={t('user3rd:photo')}
              value={user.photo}
              onChange={onPhotoChange}
              className={styles.field}
              outlined
            />
          </div>
          <div className={styles.divider} />
          <div className={styles.inputs}>
            <TextField
              label={t('user3rd:bio')}
              placeholder={t('user3rd:bio-placeholder', {
                name: user.name || 'Tutorbook',
              })}
              value={user.bio}
              onChange={onBioChange}
              className={styles.field}
              outlined
              required
              rows={8}
              textarea
            />
          </div>
          <div className={styles.divider} />
          <div className={styles.inputs}>
            <TextField {...getSocialProps('website')} />
            <TextField {...getSocialProps('facebook')} />
            <TextField {...getSocialProps('instagram')} />
            <TextField {...getSocialProps('twitter')} />
            <TextField {...getSocialProps('linkedin')} />
            <TextField {...getSocialProps('github')} />
            <TextField {...getSocialProps('indiehackers')} />
          </div>
        </div>
      </div>
    </>
  );
}
