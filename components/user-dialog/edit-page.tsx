import { memo, useCallback, useLayoutEffect, useMemo, FormEvent } from 'react';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios from 'axios';
import { IconButton } from '@rmwc/icon-button';
import useTranslation from 'next-translate/useTranslation';

import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';
import Button from 'components/button';
import Loader from 'components/loader';

import { TCallback, User, UserJSON } from 'lib/model';
import { usePrevious, useSingle, useSocialProps } from 'lib/hooks';

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
  const updateLocal = useCallback(
    (updated: User) => {
      onChange(updated.toJSON());
    },
    [onChange]
  );

  const updateRemote = useCallback(async (updated: User) => {
    if (updated.id.startsWith('temp')) {
      const json = { ...updated.toJSON(), id: '' };
      const { data } = await axios.post<UserJSON>('/api/users', json);
      return User.fromJSON(data);
    }
    const url = `/api/users/${updated.id}`;
    const { data } = await axios.put<UserJSON>(url, updated.toJSON());
    return User.fromJSON(data);
  }, []);

  const initialUser = useMemo(() => User.fromJSON(value), [value]);

  const {
    data: user,
    setData: setUser,
    onSubmit,
    checked,
    loading,
    error,
  } = useSingle(initialUser, updateRemote, updateLocal);

  const getSocialProps = useSocialProps(user, setUser, styles.field, 'user');

  const prevLoading = usePrevious(loading);
  useLayoutEffect(() => {
    if (prevLoading && !loading) void openDisplay();
  }, [prevLoading, loading, openDisplay]);

  const { t } = useTranslation();

  const onNameChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const name = evt.currentTarget.value;
      setUser((prev: User) => new User({ ...prev, name }));
    },
    [setUser]
  );
  const onEmailChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const email = evt.currentTarget.value;
      setUser((prev: User) => new User({ ...prev, email }));
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
  const onMentoringSubjectsChange = useCallback(
    (subjects: string[]) => {
      setUser(
        (prev: User) =>
          new User({ ...prev, mentoring: { ...prev.mentoring, subjects } })
      );
    },
    [setUser]
  );
  const onMentoringSearchesChange = useCallback(
    (searches: string[]) => {
      setUser(
        (prev: User) =>
          new User({ ...prev, mentoring: { ...prev.mentoring, searches } })
      );
    },
    [setUser]
  );
  const onTutoringSubjectsChange = useCallback(
    (subjects: string[]) => {
      setUser(
        (prev: User) =>
          new User({ ...prev, tutoring: { ...prev.tutoring, subjects } })
      );
    },
    [setUser]
  );
  const onTutoringSearchesChange = useCallback(
    (searches: string[]) => {
      setUser(
        (prev: User) =>
          new User({ ...prev, tutoring: { ...prev.tutoring, searches } })
      );
    },
    [setUser]
  );

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputs}>
          <TextField
            label={t('user:name')}
            value={user.name}
            onChange={onNameChange}
            className={styles.field}
            outlined
            required
          />
          <TextField
            label={t('user:email')}
            value={user.email}
            onChange={onEmailChange}
            className={styles.field}
            type='email'
            outlined
            required
          />
          <TextField
            label={t('user:phone')}
            value={user.phone ? user.phone : undefined}
            onChange={onPhoneChange}
            className={styles.field}
            type='tel'
            outlined
          />
          <PhotoInput
            label={t('user:photo')}
            value={user.photo}
            onChange={onPhotoChange}
            className={styles.field}
            outlined
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <TextField
            label={t('user:bio')}
            placeholder={t('user:bio-placeholder')}
            value={user.bio}
            onChange={onBioChange}
            className={styles.field}
            required
            outlined
            rows={8}
            textarea
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <SubjectSelect
            label={t('user:mentoring-subjects')}
            placeholder={t('common:mentoring-subjects-placeholder')}
            value={user.mentoring.subjects}
            onChange={onMentoringSubjectsChange}
            aspect='mentoring'
            className={styles.field}
            outlined
          />
          <SubjectSelect
            label={t('user:mentoring-searches')}
            placeholder={t('common:mentoring-searches-placeholder')}
            value={user.mentoring.searches}
            onChange={onMentoringSearchesChange}
            aspect='mentoring'
            className={styles.field}
            outlined
          />
          <SubjectSelect
            label={t('user:tutoring-subjects')}
            placeholder={t('common:tutoring-subjects-placeholder')}
            value={user.tutoring.subjects}
            onChange={onTutoringSubjectsChange}
            aspect='tutoring'
            className={styles.field}
            outlined
          />
          <SubjectSelect
            label={t('user:tutoring-searches')}
            placeholder={t('common:tutoring-searches-placeholder')}
            value={user.tutoring.searches}
            onChange={onTutoringSearchesChange}
            aspect='tutoring'
            className={styles.field}
            outlined
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
              {t('user:error', { error: error.message })}
            </TextFieldHelperText>
          )}
        </div>
      </form>
    </div>
  );
});
