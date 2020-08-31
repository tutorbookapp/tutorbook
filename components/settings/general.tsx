import { useCallback, FormEvent } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import PhotoInput from 'components/photo-input';

import { SocialTypeAlias, SocialInterface, Org } from 'lib/model';

import { useSettings } from './context';
import styles from './settings.module.scss';

export default function General(): JSX.Element {
  const { t } = useTranslation();
  const { org, setOrg } = useSettings();

  const onSubmit = useCallback((evt: FormEvent) => evt.preventDefault(), []);
  const onNameChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const name = evt.currentTarget.value;
      setOrg((prev: Org) => new Org({ ...prev, name }));
    },
    [setOrg]
  );
  const onEmailChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const email = evt.currentTarget.value;
      setOrg((prev: Org) => new Org({ ...prev, email }));
    },
    [setOrg]
  );
  const onPhoneChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const phone = evt.currentTarget.value;
      setOrg((prev: Org) => new Org({ ...prev, phone }));
    },
    [setOrg]
  );
  const onPhotoChange = useCallback(
    (photo: string) => {
      setOrg((prev: Org) => new Org({ ...prev, photo }));
    },
    [setOrg]
  );
  const onBioChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const bio = evt.currentTarget.value;
      setOrg((prev: Org) => new Org({ ...prev, bio }));
    },
    [setOrg]
  );

  const getSocialIndex = useCallback(
    (type: string) => {
      return org.socials.findIndex((s) => s.type === type);
    },
    [org.socials]
  );
  const getSocial = useCallback(
    (type: SocialTypeAlias) => {
      const idx = getSocialIndex(type);
      return idx >= 0 ? org.socials[idx].url : '';
    },
    [getSocialIndex, org.socials]
  );
  const hasSocial = useCallback(
    (type: SocialTypeAlias) => {
      return getSocialIndex(type) >= 0;
    },
    [getSocialIndex]
  );

  const updateSocial = (type: SocialTypeAlias, url: string) => {
    const idx = getSocialIndex(type);
    const updated: SocialInterface[] = Array.from(org.socials);
    if (idx >= 0) {
      updated[idx] = { type, url };
    } else {
      updated.push({ type, url });
    }
    setOrg((prev: Org) => new Org({ ...prev, socials: updated }));
  };

  const s = (type: SocialTypeAlias, p: (v: string) => string) => ({
    outlined: true,
    className: styles.field,
    value: getSocial(type),
    label: t(`org:${type}`),
    onFocus: () => {
      const username: string = org.name
        ? org.name.replace(' ', '').toLowerCase()
        : 'yourname';
      if (!hasSocial(type)) {
        void updateSocial(type, p(username));
      }
    },
    onChange: (evt: FormEvent<HTMLInputElement>) => {
      return updateSocial(type, evt.currentTarget.value);
    },
  });

  return (
    <div className={styles.card}>
      <form onSubmit={onSubmit}>
        <div className={styles.inputs}>
          <TextField
            label={t('org:name')}
            value={org.name}
            onChange={onNameChange}
            className={styles.field}
            required
            outlined
          />
          <TextField
            label={t('org:email')}
            value={org.email}
            onChange={onEmailChange}
            className={styles.field}
            type='email'
            required
            outlined
          />
          <TextField
            label={t('org:phone')}
            value={org.phone ? org.phone : undefined}
            onChange={onPhoneChange}
            className={styles.field}
            type='tel'
            outlined
          />
          <PhotoInput
            label={t('org:photo')}
            value={org.photo}
            onChange={onPhotoChange}
            className={styles.field}
            outlined
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <TextField
            label={t('org:bio')}
            placeholder={t('org:bio-placeholder', {
              name: org.name || 'Tutorbook',
            })}
            value={org.bio}
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
        </div>
      </form>
    </div>
  );
}
