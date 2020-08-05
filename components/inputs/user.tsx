import React, { useMemo } from 'react';
import PhotoInput from 'components/photo-input';
import SubjectSelect from 'components/subject-select';
import LangSelect from 'components/lang-select';

import cn from 'classnames';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { useUser } from 'lib/account';
import { Checkbox } from '@rmwc/checkbox';
import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';
import { TimesSelectProps } from 'components/times-select';
import {
  User,
  Check,
  Verification,
  Availability,
  SocialTypeAlias,
  SocialInterface,
} from 'lib/model';
import { InputsProps, InputsConfig } from './types';

import styles from './user.module.scss';

const TimesSelect = dynamic<TimesSelectProps>(() =>
  import('components/times-select')
);

const checks: Check[] = [
  'background-check',
  'email',
  'academic-email',
  'training',
  'interview',
];

type Input =
  | 'name'
  | 'email'
  | 'phone'
  | 'photo'
  | 'bio'
  | 'socials'
  | 'availability'
  | 'mentoring'
  | 'tutoring'
  | 'langs'
  | 'parents'
  | 'verifications';

// TODO: Control focus (i.e. implement the `focused` prop that opens the inputs
// with a certain field already focused).
export default function UserInputs({
  value,
  onChange,
  renderToPortal,
  className,
  name,
  email,
  phone,
  photo,
  bio,
  socials,
  availability,
  mentoring,
  tutoring,
  langs,
  parents,
  verifications,
}: InputsProps<User, Input> & InputsConfig<Input>): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();

  const sharedProps = useMemo(
    () => ({
      outlined: true,
      renderToPortal,
      className,
    }),
    [renderToPortal, className]
  );

  const shared = (key: Input) => ({
    ...sharedProps,
    label: t(`user:${key}`),
    onChange: (event: React.FormEvent<HTMLInputElement>) =>
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
    label: t(`user:${type}`),
    onFocus: () => {
      const username: string = value.name
        ? value.name.replace(' ', '').toLowerCase()
        : 'yourname';
      if (!hasSocial(type)) {
        void updateSocial(type, p(username));
      }
    },
    onChange: (event: React.FormEvent<HTMLInputElement>) => {
      return updateSocial(type, event.currentTarget.value);
    },
  });

  // Deep copy the array of `Verification` objects.
  // @see {@link https://stackoverflow.com/a/40283265/10023158}
  const clone = (vs: Verification[]) => vs.map((v: Verification) => ({ ...v }));
  const getIndex = (check: Check) =>
    value.verifications.findIndex((v) => v.checks.indexOf(check) >= 0);

  const getChecked = (check: Check) => getIndex(check) >= 0;
  const setChecked = (
    event: React.FormEvent<HTMLInputElement>,
    check: Check
  ) => {
    const updated: Verification[] = clone(value.verifications);
    if (getIndex(check) >= 0 && !event.currentTarget.checked) {
      updated.splice(getIndex(check), 1);
    } else {
      updated.push({
        user: user.id,
        org: user.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      });
    }
    return onChange(new User({ ...value, verifications: updated }));
  };

  const getSomeChecked = () =>
    value.verifications.length > 0 &&
    value.verifications.length < checks.length;
  const getAllChecked = () => checks.every((c) => getChecked(c));
  const setAllChecked = (event: React.FormEvent<HTMLInputElement>) => {
    if (!event.currentTarget.checked)
      return onChange(new User({ ...value, verifications: [] }));
    const updated: Verification[] = clone(value.verifications);
    const checked: Check[] = Object.values(value.verifications).reduce(
      (acc, cur) => {
        return acc.concat(cur.checks);
      },
      [] as Check[]
    );
    const stillNeedsToBeChecked: Check[] = checks.filter(
      (c) => checked.indexOf(c) < 0
    );
    stillNeedsToBeChecked.forEach((check: Check) =>
      updated.push({
        user: user.id,
        org: user.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      })
    );
    return onChange(new User({ ...value, verifications: updated }));
  };

  const getValue = (check: Check) =>
    (value.verifications[getIndex(check)] || {}).notes || '';
  const setValue = (event: React.FormEvent<HTMLInputElement>, check: Check) => {
    const updated: Verification[] = clone(value.verifications);
    if (getIndex(check) >= 0) {
      updated[getIndex(check)].notes = event.currentTarget.value;
    } else {
      updated.push({
        user: user.id,
        org: user.id,
        checks: [check],
        notes: event.currentTarget.value,
        created: new Date(),
        updated: new Date(),
      });
    }
    return onChange(new User({ ...value, verifications: updated }));
  };

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
          label={t('query:langs')}
          onChange={(langs: string[]) =>
            onChange(new User({ ...value, langs }))
          }
          required
        />
      )}
      {availability && (
        <TimesSelect
          {...shared('availability')}
          value={value.availability}
          onChange={(availability: Availability) =>
            onChange(new User({ ...value, availability }))
          }
          required
        />
      )}
      {mentoring && (
        <SubjectSelect
          {...sharedProps}
          value={value.mentoring.subjects}
          label={t('user:mentoring-subjects')}
          placeholder={t('query:subjects-mentoring-placeholder')}
          onChange={(subjects: string[]) =>
            onChange(
              new User({
                ...value,
                mentoring: { ...value.mentoring, subjects },
              })
            )
          }
          aspect='mentoring'
          required
        />
      )}
      {tutoring && (
        <SubjectSelect
          {...sharedProps}
          value={value.tutoring.subjects}
          label={t('user:tutoring-subjects')}
          placeholder={t('query:subjects-tutoring-placeholder')}
          onChange={(subjects: string[]) =>
            onChange(
              new User({ ...value, tutoring: { ...value.tutoring, subjects } })
            )
          }
          aspect='tutoring'
          required
        />
      )}
      {bio && (
        <TextField
          {...sharedProps}
          onChange={(event) =>
            onChange(new User({ ...value, bio: event.currentTarget.value }))
          }
          value={value.bio}
          label={t('user:mentoring-bio')}
          placeholder={t('user:bio-placeholder')}
          required
          rows={4}
          textarea
        />
      )}
      {verifications && (
        <DataTable className={cn(styles.table, className)}>
          <DataTableContent>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeadCell hasFormControl>
                  <Checkbox
                    checked={getAllChecked()}
                    indeterminate={getSomeChecked()}
                    onChange={setAllChecked}
                  />
                </DataTableHeadCell>
                <DataTableHeadCell>
                  {t('verifications:description')}
                </DataTableHeadCell>
                <DataTableHeadCell>
                  {t('verifications:notes')}
                </DataTableHeadCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {checks.map((check: Check) => (
                <DataTableRow key={check}>
                  <DataTableCell hasFormControl>
                    <Checkbox
                      checked={getChecked(check)}
                      onChange={(event: React.FormEvent<HTMLInputElement>) =>
                        setChecked(event, check)
                      }
                    />
                  </DataTableCell>
                  <DataTableCell>{t(`verifications:${check}`)}</DataTableCell>
                  <DataTableCell>
                    <TextField
                      value={getValue(check)}
                      onChange={(event: React.FormEvent<HTMLInputElement>) =>
                        setValue(event, check)
                      }
                      className={styles.field}
                    />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableContent>
        </DataTable>
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
