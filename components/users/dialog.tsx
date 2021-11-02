import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Dialog } from '@rmwc/dialog';
import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';

import AvailabilitySelect from 'components/availability-select';
import Button from 'components/button';
import CloseIcon from 'components/icons/close';
import LangSelect from 'components/lang-select';
import Loader from 'components/loader';
import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';
import VenueInput from 'components/venue-input';

import { User, UserJSON } from 'lib/model/user';
import { Availability } from 'lib/model/availability';
import { Callback } from 'lib/model/callback';
import { Subject } from 'lib/model/subject';
import { ValidationsContext } from 'lib/context/validations';
import useAnalytics from 'lib/hooks/analytics';
import { useOrg } from 'lib/context/org';
import usePrevious from 'lib/hooks/previous';
import useSingle from 'lib/hooks/single';
import useSocialProps from 'lib/hooks/social-props';
import useTrack from 'lib/hooks/track';

const emptyUser = new User();

export interface UserDialogProps {
  setDialogOpen: Callback<boolean>;
}

export default function UserDialog({ setDialogOpen }: UserDialogProps): JSX.Element {
  const track = useTrack();

  const updateRemote = useCallback(
    async (user: User) => {
      const { data } = await axios.post<UserJSON>('/api/users', user.toJSON());
      const created = User.fromJSON(data);
      track('User Signed Up', created.toSegment());
      return created;
    },
    [track]
  );

  const { org } = useOrg();
  const { t, lang: locale } = useTranslation();
  const {
    data: user,
    setData: setUser,
    validations,
    setValidations,
    onSubmit,
    loading,
    checked,
    error,
  } = useSingle(emptyUser, updateRemote);

  useAnalytics(
    'User Signup Errored',
    () => error && { ...user.toSegment(), error }
  );

  const getSocialProps = useSocialProps(
    user,
    setUser,
    'field',
    'user',
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
  
  const [open, setOpen] = useState<boolean>(true);
  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) setOpen(false);
  }, [prevLoading, loading, checked]);

  return (
    <Dialog open={open} onClosed={() => setDialogOpen(false)}>
      <ValidationsContext.Provider value={{ validations, setValidations }}>
        <div className='wrapper'>
          <Loader active={!!loading} checked={!!checked} />
          <div className='nav'>
            <IconButton icon={<CloseIcon />} onClick={() => setOpen(false)} />
          </div>
          <form className='form' onSubmit={onSubmit}>
            <div className='inputs'>
              <TextField
                label={t('user:name')}
                value={user.name}
                onChange={onNameChange}
                className='field'
                outlined
                required
              />
              <TextField
                label={t('user:email')}
                value={user.email}
                onChange={onEmailChange}
                className='field'
                type='email'
                outlined
                required
              />
              <TextField
                label={t('user:phone')}
                value={user.phone ? user.phone : undefined}
                onChange={onPhoneChange}
                className='field'
                type='tel'
                outlined
              />
            </div>
            <div className='divider' />
            <div className='inputs'>
              <PhotoInput
                label={t('user:photo')}
                value={user.photo}
                onChange={onPhotoChange}
                className='field'
                outlined
              />
              <PhotoInput
                label={t('user:background')}
                value={user.background}
                onChange={onBackgroundChange}
                className='field'
                outlined
              />
            </div>
            <div className='divider' />
            <div className='inputs'>
              <VenueInput
                label={t('user:venue')}
                value={user.venue}
                onChange={onVenueChange}
                className='field'
                outlined
              />
            </div>
            <div className='divider' />
            <div className='inputs'>
              <SubjectSelect
                label={t('user:subjects')}
                placeholder={t('common:subjects-placeholder')}
                value={user.subjects}
                onChange={onSubjectsChange}
                className='field'
                renderToPortal
                outlined
              />
              <LangSelect
                className='field'
                label={t('user:langs')}
                placeholder={t('common:langs-placeholder')}
                onChange={onLangsChange}
                value={user.langs}
                renderToPortal
                outlined
              />
              <AvailabilitySelect
                className='field'
                label={t('user:availability')}
                onChange={onAvailabilityChange}
                value={user.availability}
                renderToPortal
                outlined
              />
              <TextField
                label={t('user:bio')}
                placeholder={
                  (org?.signup[locale] || {}).bio || t('common:bio-placeholder')
                }
                helpText={{
                  persistent: true,
                  children: t('common:bio-help', { name: 'your' }),
                }}
                value={user.bio}
                onChange={onBioChange}
                className='field'
                outlined
                rows={8}
                textarea
              />
              <TextField
                label={t('user:reference', {
                  org: org?.name || 'Tutorbook',
                })}
                placeholder={t('common:reference-placeholder', {
                  org: org?.name || 'Tutorbook',
                })}
                value={user.reference}
                onChange={onReferenceChange}
                className='field'
                outlined
                rows={3}
                textarea
              />
            </div>
            <div className='divider' />
            <div className='inputs'>
              <TextField {...getSocialProps('website')} />
              <TextField {...getSocialProps('facebook')} />
              <TextField {...getSocialProps('instagram')} />
              <TextField {...getSocialProps('twitter')} />
              <TextField {...getSocialProps('linkedin')} />
              <TextField {...getSocialProps('github')} />
              <TextField {...getSocialProps('indiehackers')} />
              <Button
                disabled={loading}
                label='Create user'
                type='submit'
                raised
                arrow
              />
              {!!error && (
                <div data-cy='error' className='error'>
                  Hmm, it looks like we hit a snag. To get help, contact team@tutorbook.org with the following error message: {error}
                </div>
              )}
            </div>
          </form>
          <style jsx>{`
            .wrapper {
              max-height: calc(100vh - 32px);
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              height: 100%;
            }

            .nav {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid var(--accents-2);
              padding: 12px 14px;
            }

            .nav :global(button) {
              padding: 9px;
              width: 36px;
              height: 36px;
            }

            .nav :global(button svg) {
              display: block;
              height: 18px;
              width: 18px;
            }

            .form {
              overflow: auto;
              height: 100%;
              box-sizing: border-box;
            }

            .form .divider {
              border-top: 1px solid var(--accents-2);
            }

            .form .inputs {
              margin: 24px auto;
              padding: 0 24px;
              display: flex;
              flex-direction: column;
            }

            .form :global(button) {
              margin: 8px 0 0;
              width: 100%;
            }
          `}</style>
        </div>
      </ValidationsContext.Provider>
    </Dialog>
  );
}
