import { FormEvent } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import PhotoInput from 'components/photo-input';

import { Org, SocialInterface, SocialTypeAlias } from 'lib/model';

import { InputsConfig, InputsProps } from './types';

type Input =
  | 'name'
  | 'email'
  | 'phone'
  | 'photo'
  | 'bio'
  | 'socials'
  | 'home'
  | 'signup';

// TODO: Control focus (i.e. implement the `focused` prop that opens the inputs
// with a certain field already focused).
export default function OrgInputs({
  value,
  onChange,
  className,
  name,
  email,
  phone,
  photo,
  bio,
  socials,
  home,
  signup,
}: InputsProps<Org, Input> & InputsConfig<Input>): JSX.Element {
  const { t, lang: locale } = useTranslation();

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
    return onChange(new Org({ ...value, socials: updated }));
  };

  const s = (type: SocialTypeAlias, p: (v: string) => string) => ({
    className,
    outlined: true,
    value: getSocial(type),
    label: t(`org:${type}`),
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
      {name && (
        <TextField
          label={t('org:name')}
          value={value.name}
          onChange={(evt: FormEvent<HTMLInputElement>) =>
            onChange(new Org({ ...value, name: evt.currentTarget.value }))
          }
          className={className}
          required
          outlined
        />
      )}
      {email && (
        <TextField
          label={t('org:email')}
          value={value.email}
          onChange={(evt: FormEvent<HTMLInputElement>) =>
            onChange(new Org({ ...value, email: evt.currentTarget.value }))
          }
          className={className}
          type='email'
          required
          outlined
        />
      )}
      {phone && (
        <TextField
          label={t('org:phone')}
          value={value.phone ? value.phone : undefined}
          onChange={(evt: FormEvent<HTMLInputElement>) =>
            onChange(new Org({ ...value, phone: evt.currentTarget.value }))
          }
          className={className}
          type='tel'
          outlined
        />
      )}
      {photo && (
        <PhotoInput
          label={t('org:photo')}
          value={value.photo}
          onChange={(p: string) => onChange(new Org({ ...value, photo: p }))}
          className={className}
          outlined
        />
      )}
      {bio && (
        <TextField
          label={t('org:bio')}
          placeholder={t('org:bio-placeholder', {
            name: value.name || 'Tutorbook',
          })}
          value={value.bio}
          onChange={(evt: FormEvent<HTMLInputElement>) =>
            onChange(new Org({ ...value, bio: evt.currentTarget.value }))
          }
          className={className}
          outlined
          required
          rows={8}
          textarea
        />
      )}
      {socials && (
        <>
          <TextField {...s('website', (v) => `https://${v}.com`)} />
          <TextField {...s('facebook', (v) => `https://facebook.com/${v}`)} />
          <TextField {...s('instagram', (v) => `https://instagram.com/${v}`)} />
          <TextField {...s('twitter', (v) => `https://twitter.com/${v}`)} />
          <TextField
            {...s('linkedin', (v) => `https://linkedin.com/in/${v}`)}
          />
          <TextField {...s('github', (v) => `https://github.com/${v}`)} />
          <TextField
            {...s('indiehackers', (v) => `https://indiehackers.com/${v}`)}
          />
        </>
      )}
      {home && (
        <>
          <PhotoInput
            label={t('org:home-photo')}
            value={value.home[locale].photo || ''}
            onChange={(p: string) =>
              onChange(
                new Org({
                  ...value,
                  home: {
                    ...value.home,
                    [locale]: { ...value.home[locale], photo: p },
                  },
                })
              )
            }
            className={className}
            outlined
          />
          <TextField
            label={t('org:home-header')}
            placeholder={t('org:home-header-placeholder')}
            value={value.home[locale].header}
            onChange={(evt) =>
              onChange(
                new Org({
                  ...value,
                  home: {
                    ...value.home,
                    [locale]: {
                      ...value.home[locale],
                      header: evt.currentTarget.value,
                    },
                  },
                })
              )
            }
            className={className}
            outlined
            required
          />
          <TextField
            label={t('org:home-body')}
            placeholder={t('org:home-body-placeholder')}
            value={value.home[locale].body}
            className={className}
            onChange={(evt) =>
              onChange(
                new Org({
                  ...value,
                  home: {
                    ...value.home,
                    [locale]: {
                      ...value.home[locale],
                      body: evt.currentTarget.value,
                    },
                  },
                })
              )
            }
            outlined
            required
            rows={8}
            textarea
          />
        </>
      )}
    </>
  );
}
