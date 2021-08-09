import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Select } from '@rmwc/select';
import { TextField } from '@rmwc/textfield';
import { dequal } from 'dequal';
import to from 'await-to-js';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import SubjectSelect from 'components/subject-select';
import Loader from 'components/loader';
import TimeSelect from 'components/time-select';
import UserSelect from 'components/user-select';

import { Meeting, MeetingJSON } from 'lib/model/meeting';
import { User, UserJSON } from 'lib/model/user';
import { join, translate } from 'lib/utils';
import { APIErrorJSON } from 'lib/model/error';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { Option } from 'lib/model/query/base';
import { Timeslot } from 'lib/model/timeslot';
import { UsersQuery } from 'lib/model/query/users';
import { getErrorMessage } from 'lib/fetch';
import { loginWithGoogle } from 'lib/firebase/login';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import styles from './request-form.module.scss';

export interface RequestFormProps {
  user: User;
}

export default function RequestForm({
  user: volunteer,
}: RequestFormProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const { org } = useOrg();
  const { user, updateUser } = useUser();
  const { t, lang: locale } = useTranslation();
  const { data: children } = useSWR<ListUsersRes>(
    user.id ? new UsersQuery({ parents: [user.id] }).endpoint : null
  );

  const [students, setStudents] = useState<User[]>([]);
  const [child, setChild] = useState<User>(new User());
  const [student, setStudent] = useState<string>('Me');
  const [options, setOptions] = useState<Record<string, User>>({
    Me: user,
    'My child': child,
  });
  useEffect(() => {
    setOptions((prev) => {
      const kids = children?.users.map((u) => User.fromJSON(u)) || [];
      const updated = {
        Me: user,
        'My child': child,
        ...Object.fromEntries(kids.map((u) => [u.firstName, u])),
      };
      if (dequal(updated, prev)) return prev;
      return updated;
    });
  }, [user, child, children]);

  const [subjects, setSubjects] = useState<Option<string>[]>([]);
  const [message, setMessage] = useState<string>('');
  const [time, setTime] = useState<Timeslot>();

  const [phone, setPhone] = useState<string>(user.phone);
  const [reference, setReference] = useState<string>(user.reference);

  useEffect(() => {
    async function validatePhone(): Promise<void> {
      const { default: getPhone } = await import('phone');
      setPhone((prev) => getPhone(prev).phoneNumber || prev);
    }
    void validatePhone();
  }, [phone]);

  useEffect(() => setPhone(user.phone), [user.phone]);
  useEffect(() => setReference(user.reference), [user.reference]);

  const userMissingData = useMemo(
    () =>
      (!user.phone && org?.profiles.includes('phone')) ||
      (!user.reference && org?.profiles.includes('reference')),
    [user.phone, user.reference, org]
  );

  // TODO: Fix the `await-to-js` types so that TypeScript knows that `res` is
  // defined whenever `err` is not defined (that way I can get rid of all the
  // unnecessary `if (res)` statements).
  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError('');
      setLoading(true);
      let updatedUser = new User({ ...user, phone, reference });
      if (!user.id) {
        const [err, signedUpUser] = await to(loginWithGoogle(updatedUser));
        if (err) {
          setLoading(false);
          setError(
            t('error:response', {
              action: 'logging in with Google',
              error: err.message,
            })
          );
          return;
        }
        if (signedUpUser) updatedUser = signedUpUser;
      } else if (userMissingData) {
        const [err, res] = await to<
          AxiosResponse<UserJSON>,
          AxiosError<APIErrorJSON>
        >(axios.put('/api/account', updatedUser.toJSON()));
        if (err) {
          setLoading(false);
          setError(getErrorMessage(err, 'updating profile', t));
          return;
        }
        if (res) {
          updatedUser = User.fromJSON(res.data);
          await updateUser(updatedUser);
        }
      }
      const people: User[] = [new User({ ...volunteer, roles: ['tutor'] })];
      const creator: User = new User({ ...updatedUser, roles: [] });
      if (student === 'Me') {
        creator.roles = ['tutee'];
        people.push(creator);
      } else if (student === 'My child') {
        const updatedChild = {
          ...child.toJSON(),
          roles: ['tutee'], // Specifying roles skips signup emails.
          parents: [updatedUser.id], // Use now-logged-in parent ID.
        };
        const [err, res] = await to<
          AxiosResponse<UserJSON>,
          AxiosError<APIErrorJSON>
        >(axios.post('/api/users', updatedChild));
        if (err) {
          setLoading(false);
          setError(getErrorMessage(err, 'creating child account', t));
          return;
        }
        if (res) {
          creator.roles = ['parent'];
          people.push(creator);
          people.push(
            new User({ ...User.fromJSON(res.data), roles: ['tutee'] })
          );
        }
      } else {
        creator.roles = ['parent'];
        people.push(creator);
        people.push(new User({ ...options[student], roles: ['tutee'] }));
      }
      const meeting = new Meeting({
        time,
        people,
        creator,
        description: message,
        org: org?.id || 'default',
        subjects: subjects.map((s) => s.value),
      });
      const [err] = await to<
        AxiosResponse<MeetingJSON>,
        AxiosError<APIErrorJSON>
      >(axios.post('/api/meetings', meeting.toJSON()));
      if (err) {
        setLoading(false);
        setError(getErrorMessage(err, 'creating meeting', t));
      } else {
        setChecked(true);
      }
    },
    [
      user,
      student,
      volunteer,
      options,
      child,
      org,
      time,
      message,
      subjects,
      phone,
      reference,
      updateUser,
      userMissingData,
      t,
    ]
  );

  const i18nPrefix = useMemo(() => (student !== 'Me' ? 'for-others-' : ''), [
    student,
  ]);
  const messagePlaceholder = useMemo(() => {
    const data = {
      person: student === 'Me' ? 'I' : options[student].firstName || 'They',
      subject: join(subjects.map((s) => s.label)) || 'Computer Science',
    };
    if (org?.booking[locale]?.message)
      return translate(org.booking[locale].message, data);
    return t('match3rd:message-placeholder', data);
  }, [t, locale, org, student, subjects, options]);

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <Loader active={loading} checked={checked} />
      <div className={styles.inputs}>
        <UserSelect
          required
          label={t('match3rd:students')}
          query={
            org && org.members.includes(user.id)
              ? { orgs: [org.id] }
              : { parents: [user.id] }
          }
          onUsersChange={setStudents}
          users={students}
          className={styles.field}
          autoOpenMenu
          outlined
        />
        <Select
          options={Object.keys(options)}
          value={student}
          onChange={(evt) => setStudent(evt.currentTarget.value)}
          label={t('match3rd:students')}
          className={styles.field}
          enhanced
          outlined
          required
        />
        {student === 'My child' && (
          <>
            <TextField
              label='Child name'
              value={child.name}
              onChange={(evt) => {
                const name = evt.currentTarget.value;
                setChild((prev) => new User({ ...prev, name }));
              }}
              className={styles.field}
              outlined
              required
            />
            <TextField
              label='Child age'
              value={child.age}
              onChange={(evt) => {
                const age = Number(evt.currentTarget.value);
                setChild((prev) => new User({ ...prev, age }));
              }}
              className={styles.field}
              type='number'
              outlined
              required
            />
          </>
        )}
      </div>
      <div className={styles.divider} />
      <div className={styles.inputs}>
        <SubjectSelect
          required
          outlined
          autoOpenMenu
          label={t(`match3rd:${i18nPrefix}subjects`)}
          className={styles.field}
          onSelectedChange={setSubjects}
          selected={subjects}
          options={volunteer.subjects}
        />
        <TimeSelect
          required
          outlined
          label={t(`match3rd:${i18nPrefix}time`)}
          className={styles.field}
          onChange={setTime}
          value={time}
          uid={volunteer.id}
        />
        <TextField
          outlined
          textarea
          rows={4}
          required
          placeholder={messagePlaceholder}
          label={t(`match3rd:${i18nPrefix}message`)}
          className={styles.field}
          onChange={(evt) => setMessage(evt.currentTarget.value)}
          value={message}
        />
        {!userMissingData && (
          <>
            <Button
              className={styles.btn}
              label={
                !user.id ? t('match3rd:login-btn') : t('match3rd:send-btn')
              }
              disabled={loading}
              google={!user.id}
              raised
              arrow
            />
            {!!error && (
              <div data-cy='error' className={styles.error}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
      {userMissingData && (
        <>
          <div className={styles.divider} />
          <div className={styles.inputs}>
            {!user.phone && org?.profiles.includes('phone') && (
              <TextField
                label={t('user3rd:phone')}
                value={phone}
                onChange={(evt) => setPhone(evt.currentTarget.value)}
                className={styles.field}
                type='tel'
                outlined
                required
              />
            )}
            {!user.reference && org?.profiles.includes('reference') && (
              <TextField
                className={styles.field}
                label={t('user3rd:reference', {
                  org: org.name || 'Tutorbook',
                })}
                placeholder={t('common:reference-placeholder', {
                  org: org.name || 'Tutorbook',
                })}
                value={reference}
                onChange={(evt) => setReference(evt.currentTarget.value)}
                rows={3}
                textarea
                outlined
                required
              />
            )}
            <Button
              className={styles.btn}
              label={
                !user.id ? t('match3rd:login-btn') : t('match3rd:send-btn')
              }
              disabled={loading}
              google={!user.id}
              raised
              arrow
            />
            {!!error && (
              <div data-cy='error' className={styles.error}>
                {error}
              </div>
            )}
          </div>
        </>
      )}
    </form>
  );
}
