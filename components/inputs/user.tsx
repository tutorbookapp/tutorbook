import { FormEvent, useMemo } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import LangSelect from 'components/lang-select';
import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';

import { SocialInterface, SocialTypeAlias, User } from 'lib/model';

import { InputsConfig, InputsProps } from './types';

type Input =
  | 'name'
  | 'email'
  | 'phone'
  | 'photo'
  | 'bio'
  | 'socials'
  | 'mentoringSubjects'
  | 'mentoringSearches'
  | 'tutoringSubjects'
  | 'tutoringSearches'
  | 'langs'
  | 'parents';

interface Props {
  mentoringRequired?: boolean;
  tutoringRequired?: boolean;
}

// TODO: Control focus (i.e. implement the `focused` prop that opens the inputs
// with a certain field already focused).
export default function UserInputs({
  value,
  onChange,
  thirdPerson,
  renderToPortal,
  className,
  name,
  email,
  phone,
  photo,
  bio,
  socials,
  mentoringSubjects,
  mentoringSearches,
  tutoringSubjects,
  tutoringSearches,
  mentoringRequired,
  tutoringRequired,
  langs,
}: Props & InputsProps<User, Input> & InputsConfig<Input>): JSX.Element {
  const { t } = useTranslation();

  const sharedProps = useMemo(
    () => ({
      outlined: true,
      className,
    }),
    [className]
  );

  const shared = (key: Input) => ({
    ...sharedProps,
    label: t(`user${thirdPerson ? '3rd' : ''}:${key}`),
    onChange: (event: FormEvent<HTMLInputElement>) =>
      onChange(new User({ ...value, [key]: event.currentTarget.value })),
  });

  const getSocialIndex = (type: string) => {
    return value.socials.findIndex((s) => s.type === type);
  };
  const getSocial = (type: SocialTypeAlias) => {
    const index: number = getSocialIndex(type);
    return index >= 0 ? value.socials[index].url : '';
  };
  const hasSocial = (type: SocialTypeAlias) => {
    return getSocialIndex(type) >= 0;
  };

  const updateSocial = (type: SocialTypeAlias, url: string) => {
    const index: number = getSocialIndex(type);
    const updated: SocialInterface[] = Array.from(value.socials);
    if (index >= 0) {
      updated[index] = { type, url };
    } else {
      updated.push({ type, url });
    }
    return onChange(new User({ ...value, socials: updated }));
  };

  const s = (type: SocialTypeAlias, p: (v: string) => string) => ({
    ...sharedProps,
    value: getSocial(type),
    label: t(`user${thirdPerson ? '3rd' : ''}:${type}`),
    onFocus: () => {
      const username: string = value.name
        ? value.name.replace(' ', '').toLowerCase()
        : 'yourname';
      if (!hasSocial(type)) {
        void updateSocial(type, p(username));
      }
    },
    onChange: (event: FormEvent<HTMLInputElement>) => {
      return updateSocial(type, event.currentTarget.value);
    },
  });

  return (
    <>
      {name && <TextField {...shared('name')} value={value.name} required />}
      {email && (
        <TextField
          {...shared('email')}
          value={value.email}
          type='email'
          required
        />
      )}
      {phone && (
        <TextField
          {...shared('phone')}
          value={value.phone ? value.phone : undefined}
          type='tel'
        />
      )}
      {photo && (
        <PhotoInput
          {...shared('photo')}
          value={value.photo}
          onChange={(photo: string) => onChange(new User({ ...value, photo }))}
        />
      )}
      {langs && (
        <LangSelect
          {...sharedProps}
          value={value.langs}
          label={t(`user${thirdPerson ? '3rd' : ''}:langs`)}
          onChange={(langs: string[]) =>
            onChange(new User({ ...value, langs }))
          }
          required
          renderToPortal={renderToPortal}
        />
      )}
      {mentoringSubjects && (
        <SubjectSelect
          {...sharedProps}
          value={value.mentoring.subjects}
          label={t(`user${thirdPerson ? '3rd' : ''}:mentoring-subjects`)}
          placeholder={t('common:mentoring-subjects-placeholder')}
          onChange={(subjects: string[]) =>
            onChange(
              new User({
                ...value,
                mentoring: { ...value.mentoring, subjects },
              })
            )
          }
          aspect='mentoring'
          required={mentoringRequired}
          renderToPortal={renderToPortal}
        />
      )}
      {mentoringSearches && (
        <SubjectSelect
          {...sharedProps}
          value={value.mentoring.searches}
          label={t(`user${thirdPerson ? '3rd' : ''}:mentoring-searches`)}
          placeholder={t('common:mentoring-subjects-placeholder')}
          onChange={(searches: string[]) =>
            onChange(
              new User({
                ...value,
                mentoring: { ...value.mentoring, searches },
              })
            )
          }
          aspect='mentoring'
          required={mentoringRequired}
          renderToPortal={renderToPortal}
        />
      )}
      {tutoringSubjects && (
        <SubjectSelect
          {...sharedProps}
          value={value.tutoring.subjects}
          label={t(`user${thirdPerson ? '3rd' : ''}:tutoring-subjects`)}
          placeholder={t('common:tutoring-subjects-placeholder')}
          onChange={(subjects: string[]) =>
            onChange(
              new User({ ...value, tutoring: { ...value.tutoring, subjects } })
            )
          }
          aspect='tutoring'
          required={tutoringRequired}
          renderToPortal={renderToPortal}
        />
      )}
      {tutoringSearches && (
        <SubjectSelect
          {...sharedProps}
          value={value.tutoring.searches}
          label={t(`user${thirdPerson ? '3rd' : ''}:tutoring-searches`)}
          placeholder={t('common:tutoring-subjects-placeholder')}
          onChange={(searches: string[]) =>
            onChange(
              new User({ ...value, tutoring: { ...value.tutoring, searches } })
            )
          }
          aspect='tutoring'
          required={tutoringRequired}
          renderToPortal={renderToPortal}
        />
      )}
      {bio && (
        <TextField
          {...sharedProps}
          onChange={(event) =>
            onChange(new User({ ...value, bio: event.currentTarget.value }))
          }
          value={value.bio}
          label={t(`user${thirdPerson ? '3rd' : ''}:bio`)}
          placeholder={t(`user${thirdPerson ? '3rd' : ''}:bio-placeholder`)}
          required
          rows={4}
          textarea
        />
      )}
      {socials && (
        <>
          <TextField {...s('website', (v) => `https://${v}.com`)} />
          <TextField
            {...s('linkedin', (v) => `https://linkedin.com/in/${v}`)}
          />
          <TextField {...s('instagram', (v) => `https://instagram.com/${v}`)} />
          <TextField {...s('facebook', (v) => `https://facebook.com/${v}`)} />
          <TextField {...s('twitter', (v) => `https://twitter.com/${v}`)} />
          <TextField {...s('github', (v) => `https://github.com/${v}`)} />
          <TextField
            {...s('indiehackers', (v) => `https://indiehackers.com/${v}`)}
          />
        </>
      )}
    </>
  );
}
