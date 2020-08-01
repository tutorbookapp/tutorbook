import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';
import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';
import LangSelect from 'components/lang-select';
import React, { useCallback } from 'react';

import { ListDivider } from '@rmwc/list';
import { TextField } from '@rmwc/textfield';
import { TimesSelectProps } from 'components/times-select';
import {
  Availability,
  Aspect,
  Callback,
  SocialTypeAlias,
  SocialInterface,
  UserInterface,
  UserJSON,
} from 'lib/model';

import styles from './inputs.module.scss';

const TimesSelect = dynamic<TimesSelectProps>(() =>
  import('components/times-select')
);

interface InputsProps {
  value: UserJSON;
  onChange: Callback<UserJSON>;
  aspect?: Aspect;
}

const sharedProps = { className: styles.formField, outlined: true };

export default function Inputs({
  value,
  onChange,
  aspect = 'mentoring',
}: InputsProps): JSX.Element {
  const { t } = useTranslation();

  const shared = useCallback(
    (key: keyof UserInterface) => ({
      ...sharedProps,
      label: t(`signup:${key}`),
      onChange: (event: React.FormEvent<HTMLInputElement>) =>
        onChange({ ...value, [key]: event.currentTarget.value }),
    }),
    [value, onChange, t]
  );

  const getSocialIndex = useCallback(
    (type: string) => {
      return value.socials.findIndex((s: SocialInterface) => s.type === type);
    },
    [value]
  );

  const getSocial = useCallback(
    (type: SocialTypeAlias) => {
      const index: number = getSocialIndex(type);
      return index >= 0 ? value.socials[index].url : '';
    },
    [value, getSocialIndex]
  );

  const hasSocial = useCallback(
    (type: SocialTypeAlias) => {
      return getSocialIndex(type) >= 0;
    },
    [getSocialIndex]
  );

  const updateSocial = useCallback(
    (type: SocialTypeAlias, url: string) => {
      const index: number = getSocialIndex(type);
      const socials: SocialInterface[] = Array.from(value.socials);
      if (index >= 0) {
        socials[index] = { type, url };
      } else {
        socials.push({ type, url });
      }
      return onChange({ ...value, socials });
    },
    [value, onChange, getSocialIndex]
  );

  const s = useCallback(
    (type: SocialTypeAlias, p: (v: string) => string) => ({
      ...sharedProps,
      value: getSocial(type),
      label: t(`signup:${type}`),
      onFocus: () => {
        const name: string = value.name
          ? value.name.replace(' ', '').toLowerCase()
          : 'yourname';
        if (!hasSocial(type)) {
          void updateSocial(type, p(name));
        }
      },
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        return updateSocial(type, event.currentTarget.value);
      },
    }),
    [value, getSocial, updateSocial, hasSocial, t]
  );

  return (
    <>
      <TextField {...shared('name')} value={value.name} required />
      <TextField
        {...shared('email')}
        value={value.email}
        type='email'
        required
      />
      <TextField
        {...shared('phone')}
        value={value.phone ? value.phone : undefined}
        type='tel'
      />
      <PhotoInput
        {...shared('photo')}
        value={value.photo}
        onChange={(photo: string) => onChange({ ...value, photo })}
      />
      <ListDivider className={styles.divider} />
      <LangSelect
        {...sharedProps}
        value={value.langs}
        label={t('query:langs')}
        onChange={(langs: string[]) => onChange({ ...value, langs })}
        required
      />
      {aspect === 'mentoring' && (
        <>
          <SubjectSelect
            {...sharedProps}
            value={value.mentoring.subjects}
            label={t('signup:mentoring-subjects')}
            placeholder={t('query:subjects-mentoring-placeholder')}
            onChange={(subjects: string[]) =>
              onChange({ ...value, [aspect]: { ...value[aspect], subjects } })
            }
            aspect={aspect}
            required
          />
          <TextField
            {...sharedProps}
            onChange={(event) =>
              onChange({ ...value, bio: event.currentTarget.value })
            }
            value={value.bio}
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
            value={value.tutoring.subjects}
            label={t('signup:tutoring-subjects')}
            placeholder={t('query:subjects-tutoring-placeholder')}
            onChange={(subjects: string[]) =>
              onChange({ ...value, [aspect]: { ...value[aspect], subjects } })
            }
            aspect={aspect}
            required
          />
          <TimesSelect
            {...shared('availability')}
            value={Availability.fromJSON(value.availability)}
            onChange={(availability: Availability) =>
              onChange({
                ...value,
                availability: availability.toJSON(),
              })
            }
            required
          />
          <TextField
            {...sharedProps}
            onChange={(event) =>
              onChange({
                ...value,
                bio: event.currentTarget.value,
              })
            }
            value={value.bio}
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
}
