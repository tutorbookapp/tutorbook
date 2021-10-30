import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { animated, useSpring } from 'react-spring';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import AvailabilitySelect from 'components/availability-select';
import Button from 'components/button';
import LangSelect from 'components/lang-select';
import Loader from 'components/loader';
import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';
import Title from 'components/title';
import VenueInput from 'components/venue-input';

import { User, UserJSON } from 'lib/model/user';
import { Availability } from 'lib/model/availability';
import { Subject } from 'lib/model/subject';
import { ValidationsContext } from 'lib/context/validations';
import useAnalytics from 'lib/hooks/analytics';
import { useOrg } from 'lib/context/org';
import useSingle from 'lib/hooks/single';
import useSocialProps from 'lib/hooks/social-props';
import useTrack from 'lib/hooks/track';
import { useUser } from 'lib/context/user';

import styles from './signup.module.scss';

export default function Signup(): JSX.Element {
  const track = useTrack();

  const updateRemote = useCallback(
    async (updated: User) => {
      if (!updated.id) {
        track('User Signup Started', updated.toSegment());
        const { default: firebase } = await import('lib/firebase');
        await import('firebase/auth');
        const auth = firebase.auth();

        // As httpOnly cookies are to be used, do not persist any state client side.
        // @see {@link https://firebase.google.com/docs/auth/admin/manage-cookies}
        await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        
        const { data: created } = 
          await axios.post<UserJSON>('/api/users', updated.toJSON());
        await auth.signInWithCustomToken(created.token as string);
        const token = await auth.currentUser?.getIdToken();
        
        const { data: loggedIn } = 
          await axios.put<UserJSON>('/api/account', { ...created, token });
        const loggedInUser = User.fromJSON(loggedIn);
        track('User Signed Up', loggedInUser.toSegment());
        return loggedInUser;
      }
      const { data } = 
        await axios.put<UserJSON>(`/api/users/${updated.id}`, updated.toJSON());
      track('User Updated', updated.toSegment());
      return User.fromJSON(data);
    },
    [track]
  );

  const { org } = useOrg();
  const { t, lang: locale } = useTranslation();
  const { user: local, updateUser: updateLocal } = useUser();
  const {
    data: user,
    setData: setUser,
    validations,
    setValidations,
    onSubmit,
    loading,
    checked,
    error,
  } = useSingle(local, updateRemote, updateLocal);

  useAnalytics(
    'User Signup Errored',
    () => error && { ...user.toSegment(), error }
  );

  const getSocialProps = useSocialProps(
    user,
    setUser,
    styles.field,
    'user3rd',
    User
  );

  useEffect(() => {
    if (!org) return;
    setUser((prev) => {
      const orgs = new Set(prev.orgs);
      orgs.add(org.id);
      return new User({ ...prev, orgs: [...orgs] });
    });
  }, [setUser, org]);

  // TODO: Remove these now unnecessary transitions b/c aspects are gone.
  const tutorsHProps = useSpring({ transform: 'translateY(0%)' });
  const tutorsBProps = useSpring({ transform: 'translateY(0%)' });

  const onNameChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const name = evt.currentTarget.value;
      track('User Name Updated', { name });
      setUser((prev) => new User({ ...prev, name }));
    },
    [track, setUser]
  );
  const onEmailChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const email = evt.currentTarget.value;
      track('User Email Updated', { email });
      setUser((prev) => new User({ ...prev, email }));
    },
    [track, setUser]
  );
  const onPhoneChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const phone = evt.currentTarget.value;
      track('User Phone Updated', { phone });
      setUser((prev) => new User({ ...prev, phone }));
    },
    [track, setUser]
  );
  const onPhotoChange = useCallback(
    (photo: string) => {
      track('User Photo Updated', { photo });
      setUser((prev) => new User({ ...prev, photo }));
    },
    [track, setUser]
  );
  const onBackgroundChange = useCallback(
    (background: string) => {
      track('User Background Updated', { background });
      setUser((prev) => new User({ ...prev, background }));
    },
    [track, setUser]
  );
  const onVenueChange = useCallback(
    (venue: string) => {
      setUser((prev) => new User({ ...prev, venue }));
    },
    [setUser]
  );
  const onBioChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const bio = evt.currentTarget.value;
      track('User Bio Updated', { bio });
      setUser((prev) => new User({ ...prev, bio }));
    },
    [track, setUser]
  );
  const onSubjectsChange = useCallback(
    (subjects: Subject[]) => {
      track('User Subjects Updated', { subjects }, 2500);
      setUser((prev) => new User({ ...prev, subjects }));
    },
    [track, setUser]
  );
  const onAvailabilityChange = useCallback(
    (availability: Availability) => {
      // TODO: Fix the `useContinuous` hook that the `AvailabilitySelect` uses
      // to skip this callback when the component is initially mounted.
      track('User Availability Updated', {
        availability: availability.toSegment(),
      });
      setUser((prev) => new User({ ...prev, availability }));
    },
    [track, setUser]
  );
  const onLangsChange = useCallback(
    (langs: string[]) => {
      track('User Langs Updated', { langs }, 2500);
      setUser((prev) => new User({ ...prev, langs }));
    },
    [track, setUser]
  );
  const onReferenceChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const reference = evt.currentTarget.value;
      track('User Reference Updated', { reference }, 2500);
      setUser((prev) => new User({ ...prev, reference }));
    },
    [track, setUser]
  );

  const action = useMemo(() => (user.id ? 'update' : 'create'), [user.id]);

  return (
    <ValidationsContext.Provider value={{ validations, setValidations }}>
      <div className={styles.wrapper}>
        <div className={cn(styles.header, { [styles.loading]: !org })}>
          <animated.div className={styles.title} style={tutorsHProps}>
            <Title>{!org ? '' : (org.signup[locale] || {}).header || ''}</Title>
          </animated.div>
        </div>
        <div className={cn(styles.description, { [styles.loading]: !org })}>
          <animated.div style={tutorsBProps}>
            {!org ? '' : (org.signup[locale] || {}).body || ''}
          </animated.div>
        </div>
        <div className={styles.card}>
          <Loader active={loading} checked={checked} />
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.inputs}>
              <TextField
                label={t('user3rd:name')}
                value={user.name}
                onChange={onNameChange}
                className={styles.field}
                outlined
                required={org ? org.profiles.includes('name') : true}
              />
              <TextField
                label={t('user3rd:email')}
                value={user.email}
                onChange={onEmailChange}
                className={styles.field}
                type='email'
                outlined
                required={org ? org.profiles.includes('email') : true}
              />
              <TextField
                label={t('user3rd:phone')}
                value={user.phone ? user.phone : undefined}
                onChange={onPhoneChange}
                className={styles.field}
                type='tel'
                outlined
                required={org ? org.profiles.includes('phone') : false}
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.inputs}>
              <PhotoInput
                label={t('user3rd:photo')}
                value={user.photo}
                onChange={onPhotoChange}
                className={styles.field}
                outlined
                required={org ? org.profiles.includes('photo') : false}
              />
              <PhotoInput
                label={t('user3rd:background')}
                value={user.background}
                onChange={onBackgroundChange}
                className={styles.field}
                outlined
                required={org ? org.profiles.includes('background') : false}
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.inputs}>
              <VenueInput
                label={t('user3rd:venue')}
                value={user.venue}
                onChange={onVenueChange}
                className={styles.field}
                outlined
                required={org ? org.profiles.includes('venue') : false}
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.inputs}>
              <SubjectSelect
                label={t('user3rd:subjects')}
                placeholder={t('common:subjects-placeholder')}
                value={user.subjects}
                onChange={onSubjectsChange}
                className={styles.field}
                required={org ? org.profiles.includes('subjects') : true}
                outlined
              />
              <LangSelect
                className={styles.field}
                label={t('user3rd:langs')}
                placeholder={t('common:langs-placeholder')}
                onChange={onLangsChange}
                value={user.langs}
                required={org ? org.profiles.includes('langs') : true}
                outlined
              />
              <AvailabilitySelect
                className={styles.field}
                label={t('user3rd:availability')}
                onChange={onAvailabilityChange}
                value={user.availability}
                required={org ? org.profiles.includes('availability') : true}
                outlined
              />
              <TextField
                label={t('user3rd:bio')}
                placeholder={
                  (org?.signup[locale] || {}).bio || t('common:bio-placeholder')
                }
                helpText={{
                  persistent: true,
                  children: t('common:bio-help', { name: 'your' }),
                }}
                value={user.bio}
                onChange={onBioChange}
                className={styles.field}
                required={org ? org.profiles.includes('bio') : true}
                outlined
                rows={8}
                textarea
              />
              <TextField
                label={t('user3rd:reference', {
                  org: org?.name || 'Tutorbook',
                })}
                placeholder={t('common:reference-placeholder', {
                  org: org?.name || 'Tutorbook',
                })}
                value={user.reference}
                onChange={onReferenceChange}
                className={styles.field}
                required={org ? org.profiles.includes('reference') : true}
                outlined
                rows={3}
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
              <Button
                disabled={loading}
                className={styles.btn}
                label={t(`user3rd:${action}-btn`)}
                type='submit'
                raised
                arrow
              />
              {!!error && (
                <div data-cy='error' className={styles.error}>
                  {t('user3rd:error', { error })}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </ValidationsContext.Provider>
  );
}
