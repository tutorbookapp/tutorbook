import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { TextField } from '@rmwc/textfield';
import { dequal } from 'dequal';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import Loader from 'components/loader';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';
import UserSelect from 'components/user-select';

import { Meeting, MeetingJSON } from 'lib/model/meeting';
import { User, UserJSON } from 'lib/model/user';
import { join, translate } from 'lib/utils';
import { APIErrorJSON } from 'lib/model/error';
import { Option } from 'lib/model/query/base';
import { Timeslot } from 'lib/model/timeslot';
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

  const me = useMemo(() => new User({ ...user, name: 'Me' }), [user]);
  const [students, setStudents] = useState<User[]>([me]);
  useEffect(() => {
    setStudents((prev) => {
      const idx = prev.findIndex((p) => p.id === me.id);
      if (idx < 0) return prev;
      return [...prev.slice(0, idx), me, ...prev.slice(idx + 1)];
    });
  }, [me]);

  const [creating, setCreating] = useState<User>();
  const onCreate = useCallback(() => setCreating(new User()), []);

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

  // TODO: Fix the `await-to-js` types so that TypeScript knows that `res` is
  // defined whenever `err` is not defined (that way I can get rid of all the
  // unnecessary `if (res)` statements).
  const onSubmit = useCallback(
    async (evt: FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      setError('');
      setLoading(true);

      // 1. Ensure that the user is logged in and has all the required info.
      const orgs = org ? [...new Set([...user.orgs, org.id])] : user.orgs;
      let updatedUser = new User({ ...user, phone, reference, orgs });
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
      } else if (!dequal(updatedUser, user)) {
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

      // 2. Replace the "Me" student with the `updatedUser` if necessary.
      const meIdx = students.findIndex((s) => s.name === 'Me');
      if (meIdx >= 0) students[meIdx] = updatedUser;

      // 3. Ensure that the students are all created.
      const creator = new User({ ...updatedUser, roles: [] });
      const people = [new User({ ...volunteer, roles: ['tutor'] })];
      if (!org?.members.includes(updatedUser.id)) creator.roles = ['parent'];
      if (creating) {
        const student = {
          ...creating.toJSON(),
          roles: ['tutee'],
          orgs: [org?.id || 'default'],
          parents: creator.roles.includes('parent') ? [creator.id] : [],
        };
        const [err, res] = await to<
          AxiosResponse<UserJSON>,
          AxiosError<APIErrorJSON>
        >(axios.post('/api/users', student));
        if (err) {
          setLoading(false);
          setError(getErrorMessage(err, 'creating student account', t));
          return;
        }
        if (res) people.push(User.fromJSON({ ...res.data, roles: ['tutee'] }));
      } else {
        students.forEach((student) => {
          if (student.id === creator.id) {
            creator.roles = ['tutee'];
            return;
          }
          people.push(new User({ ...student, roles: ['tutee'] }));
        });
      }
      if (creator.roles.length) people.push(creator);

      // 4. Create the meeting.
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
        return;
      }
      setChecked(true);
    },
    [
      user,
      students,
      creating,
      volunteer,
      org,
      time,
      message,
      subjects,
      phone,
      reference,
      updateUser,
      t,
    ]
  );

  const i18nPrefix = useMemo(() => {
    if (students.length === 1 && students[0].id === user.id) return '';
    return 'for-others-';
  }, [students, user.id]);
  const messagePlaceholder = useMemo(() => {
    const studentIsMe = students.length === 1 && students[0].id === user.id;
    const studentFirstNames = join(students.map((s) => s.firstName));
    const data = {
      person: studentIsMe ? 'I' : studentFirstNames || 'They',
      subject: join(subjects.map((s) => s.label)) || 'Computer Science',
    };
    if (org?.booking[locale]?.message)
      return translate(org.booking[locale].message, data);
    return t('match3rd:message-placeholder', data);
  }, [t, locale, org, students, user.id, subjects]);
  const userMissingData = useMemo(
    () =>
      (!user.phone && org?.profiles.includes('phone')) ||
      (!user.reference && org?.profiles.includes('reference')),
    [user.phone, user.reference, org]
  );
  const userSelectQuery = useMemo(
    () =>
      org && org.members.includes(user.id)
        ? { orgs: [org.id] }
        : { parents: [user.id] },
    [org, user.id]
  );

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <Loader active={loading} checked={checked} />
      <div className={styles.inputs}>
        {!creating && (
          <UserSelect
            required
            label={t('match3rd:students')}
            query={userSelectQuery}
            onUsersChange={setStudents}
            users={students}
            className={styles.field}
            autoOpenMenu
            outlined
            create='Create student'
            onCreate={onCreate}
          />
        )}
        {creating && (
          <>
            <TextField
              label='Student name'
              value={creating.name}
              onChange={(evt) => {
                const name = evt.currentTarget.value;
                setCreating((p) => new User({ ...p, name }));
              }}
              className={styles.field}
              outlined
              required
            />
            <TextField
              label='Student age'
              value={creating.age}
              onChange={(evt) => {
                const age = Number(evt.currentTarget.value);
                setCreating((p) => new User({ ...p, age }));
              }}
              className={styles.field}
              type='number'
              outlined
              required
            />
            <TextField
              label='Student email address'
              value={creating.email}
              onChange={(evt) => {
                const email = evt.currentTarget.value;
                setCreating((p) => new User({ ...p, email }));
              }}
              className={styles.field}
              type='email'
              outlined
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
