import { useUser } from 'lib/account';
import { signup } from 'lib/account/signup';
import { TextField } from '@rmwc/textfield';
import { ListDivider } from '@rmwc/list';
import { Card } from '@rmwc/card';
import {
  Availability,
  UserInterface,
  SocialTypeAlias,
  User,
  Aspect,
  SocialInterface,
} from 'lib/model';

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  FormEvent,
} from 'react';
import PhotoInput from 'components/photo-input';
import TimesSelect from 'components/times-select';
import SubjectSelect from 'components/subject-select';
import LangSelect from 'components/lang-select';
import Loader from 'components/loader';
import Button from 'components/button';

import useTranslation from 'next-translate/useTranslation';

import styles from './volunteer-form.module.scss';

interface VolunteerFormProps {
  aspect: Aspect;
  org?: string;
}

export default function VolunteerForm({
  aspect,
  org,
}: VolunteerFormProps): JSX.Element {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();

  const [submittingMentor, setSubmittingMentor] = useState<boolean>(false);
  const [submittingTutor, setSubmittingTutor] = useState<boolean>(false);
  const [submittedMentor, setSubmittedMentor] = useState<boolean>(false);
  const [submittedTutor, setSubmittedTutor] = useState<boolean>(false);

  const submitting = useMemo(
    () => (aspect === 'mentoring' ? submittingMentor : submittingTutor),
    [aspect, submittingMentor, submittingTutor]
  );
  const submitted = useMemo(
    () => (aspect === 'mentoring' ? submittedMentor : submittedTutor),
    [aspect, submittedMentor, submittedTutor]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setSubmittingMentor((prev) => aspect === 'mentoring' || prev);
      setSubmittingTutor((prev) => aspect === 'tutoring' || prev);
      await signup(user);
      setSubmittedMentor((prev) => aspect === 'mentoring' || prev);
      setSubmittedTutor((prev) => aspect === 'tutoring' || prev);
      setSubmittingMentor((prev) => aspect === 'mentoring' && !prev);
      setSubmittingTutor((prev) => aspect === 'tutoring' && !prev);
      setTimeout(() => {
        setSubmittedMentor((prev) => aspect === 'mentoring' && !prev);
        setSubmittedTutor((prev) => aspect === 'tutoring' && !prev);
      }, 2000);
    },
    [aspect, user]
  );

  useEffect(() => {
    if (!org) return;
    const { orgs, ...rest } = user;
    const idx: number = orgs.indexOf(org);
    if (idx < 0) {
      void updateUser(new User({ ...rest, orgs: [...orgs, org] }));
    } else {
      const updated = [...orgs.slice(0, idx), org, ...orgs.slice(idx + 1)];
      void updateUser(new User({ ...rest, orgs: updated }));
    }
  }, [org, user, updateUser]);

  const inputs: JSX.Element = useMemo(() => {
    const sharedProps = { className: styles.formField, outlined: true };
    const shared = (key: keyof UserInterface) => ({
      ...sharedProps,
      label: t(`signup:${key}`),
      onChange: (event: React.FormEvent<HTMLInputElement>) =>
        updateUser(new User({ ...user, [key]: event.currentTarget.value })),
    });
    const getSocialIndex = (type: string) => {
      return user.socials.findIndex((s: SocialInterface) => s.type === type);
    };
    const getSocial = (type: SocialTypeAlias) => {
      const index: number = getSocialIndex(type);
      return index >= 0 ? user.socials[index].url : '';
    };
    const hasSocial = (type: SocialTypeAlias) => getSocialIndex(type) >= 0;
    const updateSocial = (type: SocialTypeAlias, url: string) => {
      const index: number = getSocialIndex(type);
      const socials: SocialInterface[] = Array.from(user.socials);
      if (index >= 0) {
        socials[index] = { type, url };
      } else {
        socials.push({ type, url });
      }
      return updateUser(new User({ ...user, socials }));
    };
    const s = (type: SocialTypeAlias, placeholder: (v: string) => string) => ({
      ...sharedProps,
      value: getSocial(type),
      label: t(`signup:${type}`),
      onFocus: () => {
        const name: string = user.name
          ? user.name.replace(' ', '').toLowerCase()
          : 'yourname';
        if (!hasSocial(type)) {
          void updateSocial(type, placeholder(name));
        }
      },
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        return updateSocial(type, event.currentTarget.value);
      },
    });
    return (
      <>
        <TextField {...shared('name')} value={user.name} required />
        <TextField
          {...shared('email')}
          value={user.email}
          type='email'
          required
        />
        <TextField
          {...shared('phone')}
          value={user.phone ? user.phone : undefined}
          type='tel'
        />
        <PhotoInput
          {...shared('photo')}
          value={user.photo}
          onChange={(photo: string) => updateUser(new User({ ...user, photo }))}
        />
        <ListDivider className={styles.divider} />
        <LangSelect
          {...sharedProps}
          value={user.langs}
          label={t('query:langs')}
          onChange={(langs: string[]) =>
            updateUser(new User({ ...user, langs }))
          }
          required
        />
        {aspect === 'mentoring' && (
          <>
            <SubjectSelect
              {...sharedProps}
              value={user.mentoring.subjects}
              label={t('signup:mentoring-subjects')}
              placeholder={t('query:subjects-mentoring-placeholder')}
              onChange={(subjects: string[]) =>
                updateUser(
                  new User({ ...user, [aspect]: { ...user[aspect], subjects } })
                )
              }
              aspect={aspect}
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                updateUser(
                  new User({
                    ...user,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={user.bio}
              label={t('signup:mentoring-bio')}
              placeholder={t('signup:bio-placeholder')}
              required
              rows={4}
              textarea
            />
          </>
        )}
        {aspect === 'tutoring' && (
          <>
            <SubjectSelect
              {...sharedProps}
              value={user.tutoring.subjects}
              label={t('signup:tutoring-subjects')}
              placeholder={t('query:subjects-tutoring-placeholder')}
              onChange={(subjects: string[]) =>
                updateUser(
                  new User({ ...user, [aspect]: { ...user[aspect], subjects } })
                )
              }
              aspect={aspect}
              required
            />
            <TimesSelect
              {...shared('availability')}
              value={user.availability}
              onChange={(availability: Availability) =>
                updateUser(
                  new User({
                    ...user,
                    availability,
                  })
                )
              }
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                updateUser(
                  new User({
                    ...user,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={user.bio}
              label={t('signup:tutoring-bio')}
              placeholder={t('signup:bio-placeholder')}
              required
              rows={4}
              textarea
            />
          </>
        )}
        <ListDivider className={styles.divider} />
        <TextField {...s('website', (v) => `https://${v}.com`)} />
        <TextField {...s('linkedin', (v) => `https://linkedin.com/in/${v}`)} />
        <TextField {...s('twitter', (v) => `https://twitter.com/${v}`)} />
        <TextField {...s('facebook', (v) => `https://facebook.com/${v}`)} />
        <TextField {...s('instagram', (v) => `https://instagram.com/${v}`)} />
        <TextField {...s('github', (v) => `https://github.com/${v}`)} />
        <TextField
          {...s('indiehackers', (v) => `https://indiehackers.com/${v}`)}
        />
      </>
    );
  }, [aspect, user, updateUser, t]);

  return (
    <Card className={styles.formCard}>
      <Loader active={submitting || submitted} checked={submitted} />
      <form className={styles.form} onSubmit={handleSubmit}>
        {inputs}
        {!user.id && (
          <Button
            className={styles.formSubmitButton}
            label={t(
              user.id
                ? 'signup:submit-update-btn'
                : `signup:submit-${aspect}-btn`
            )}
            disabled={submitting || submitted}
            raised
            arrow
          />
        )}
      </form>
    </Card>
  );
}
