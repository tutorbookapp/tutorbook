import { FormEvent, useCallback, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';
import cn from 'classnames';

import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';
import Button from 'components/button';
import Loader from 'components/loader';
import Title from 'components/title';

import {
  Aspect,
  OrgJSON,
  SocialInterface,
  SocialTypeAlias,
  User,
  UserJSON,
} from 'lib/model';
import { signup } from 'lib/account/signup';
import { useSingle } from 'lib/hooks';
import { useUser } from 'lib/account';

import styles from './signup.module.scss';

interface SignupProps {
  aspect: Aspect;
  org?: OrgJSON;
}

export default function Signup({ aspect, org }: SignupProps): JSX.Element {
  const updateRemote = useCallback(async (updated: User) => {
    if (!updated.id) return signup(updated);
    const url = `/api/users/${updated.id}`;
    const { data } = await axios.put<UserJSON>(url, updated.toJSON());
    return User.fromJSON(data);
  }, []);

  const { t, lang: locale } = useTranslation();
  const { user: local, updateUser: updateLocal } = useUser();
  const {
    data: user,
    setData: setUser,
    onSubmit,
    error,
    loading,
    checked,
  } = useSingle(local, updateRemote, updateLocal);

  useEffect(() => {
    if (!org) return;
    setUser((prev: User) => {
      const orgs = new Set(prev.orgs);
      orgs.add(org.id);
      return new User({ ...prev, orgs: [...orgs] });
    });
  }, [setUser, org]);

  const mentorsHProps = useSpring({
    transform: `translateY(-${aspect === 'mentoring' ? 0 : 100}%)`,
  });
  const mentorsBProps = useSpring({
    transform: `translateY(-${aspect === 'mentoring' ? 0 : 100}%)`,
  });
  const tutorsHProps = useSpring({
    transform: `translateY(${aspect === 'tutoring' ? 0 : 100}%)`,
  });
  const tutorsBProps = useSpring({
    transform: `translateY(${aspect === 'tutoring' ? 0 : 100}%)`,
  });

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
  const onSubjectsChange = useCallback(
    (subjects: string[]) => {
      setUser(
        (prev: User) =>
          new User({ ...prev, [aspect]: { ...prev[aspect], subjects } })
      );
    },
    [setUser, aspect]
  );

  type GetPlaceholderCallback = (username: string) => string;

  const getSocialProps = useCallback(
    (type: SocialTypeAlias, getPlaceholder: GetPlaceholderCallback) => {
      const idx = user.socials.findIndex((s) => s.type === type);
      const val = idx >= 0 ? user.socials[idx].url : '';

      function updateSocial(url: string): void {
        const updated: SocialInterface[] = Array.from(user.socials);
        if (idx >= 0) {
          updated[idx] = { type, url };
        } else {
          updated.push({ type, url });
        }
        void setUser((prev: User) => new User({ ...prev, socials: updated }));
      }

      return {
        value: val,
        outlined: true,
        className: styles.field,
        label: t(`user3rd:${type}`),
        onFocus: () => {
          const n = (user.name || 'yourname').replace(' ', '').toLowerCase();
          if (idx < 0) updateSocial(getPlaceholder(n));
        },
        setUser: (evt: FormEvent<HTMLInputElement>) => {
          updateSocial(evt.currentTarget.value);
        },
      };
    },
    [setUser, user.socials, user.name, t]
  );

  return (
    <div className={styles.wrapper}>
      <div className={cn(styles.header, { [styles.loading]: !org })}>
        <animated.div style={mentorsHProps}>
          <Title>
            {!org ? '' : (org.signup[locale].mentoring || {}).header || ''}
          </Title>
        </animated.div>
        <animated.div style={tutorsHProps}>
          <Title>
            {!org ? '' : (org.signup[locale].tutoring || {}).header || ''}
          </Title>
        </animated.div>
      </div>
      <div className={cn(styles.description, { [styles.loading]: !org })}>
        <animated.div style={mentorsBProps}>
          {!org ? '' : (org.signup[locale].mentoring || {}).body || ''}
        </animated.div>
        <animated.div style={tutorsBProps}>
          {!org ? '' : (org.signup[locale].tutoring || {}).body || ''}
        </animated.div>
      </div>
      <div className={styles.formCard}>
        <Loader active={loading} checked={checked} />
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.inputs}>
            <TextField
              label={t('user3rd:name')}
              value={user.name}
              onChange={onNameChange}
              className={styles.field}
              outlined
              required
            />
            <TextField
              label={t('user3rd:email')}
              value={user.email}
              onChange={onEmailChange}
              className={styles.field}
              type='email'
              outlined
              required
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
            <SubjectSelect
              label={t(`user3rd:${aspect}-subjects`)}
              placeholder={t(`common:${aspect}-subjects-placeholder`)}
              value={user[aspect].subjects}
              onChange={onSubjectsChange}
              aspect={aspect}
              required
              className={styles.field}
              outlined
            />
            <TextField
              label={t('user3rd:bio')}
              placeholder={t('user3rd:bio-placeholder')}
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
            <TextField
              {...getSocialProps('website', (v) => `https://${v}.com`)}
            />
            <TextField
              {...getSocialProps(
                'facebook',
                (v) => `https://facebook.com/${v}`
              )}
            />
            <TextField
              {...getSocialProps(
                'instagram',
                (v) => `https://instagram.com/${v}`
              )}
            />
            <TextField
              {...getSocialProps('twitter', (v) => `https://twitter.com/${v}`)}
            />
            <TextField
              {...getSocialProps(
                'linkedin',
                (v) => `https://linkedin.com/in/${v}`
              )}
            />
            <TextField
              {...getSocialProps('github', (v) => `https://github.com/${v}`)}
            />
            <TextField
              {...getSocialProps(
                'indiehackers',
                (v) => `https://indiehackers.com/${v}`
              )}
            />
            <Button
              className={styles.btn}
              label={t(
                user.id ? 'user3rd:update-btn' : `user3rd:${aspect}-btn`
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
                {t('user3rd:error', { error: error.message })}
              </TextFieldHelperText>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
