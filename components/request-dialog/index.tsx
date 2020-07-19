import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  FormEvent,
} from 'react';
import Utils from 'lib/utils';
import Button from 'components/button';
import TimeslotInput from 'components/timeslot-input';
import SubjectSelect from 'components/subject-select';
import UserDialog from 'components/user-dialog';
import UserSelect from 'components/user-select';

import {
  ApiError,
  User,
  OrgJSON,
  RoleAlias,
  Timeslot,
  Appt,
  ApptJSON,
  Aspect,
} from 'lib/model';
import { signupWithGoogle } from 'lib/account/signup';
import { useUser, useOrgs } from 'lib/account';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { useMsg, IntlHelper } from 'lib/intl';
import { v4 as uuid } from 'uuid';

import to from 'await-to-js';
import msgs from './msgs';
import styles from './request-dialog.module.scss';

interface RequestDialogProps {
  onClosed: () => void;
  subjects: string[];
  time?: Timeslot;
  aspect: Aspect;
  user: User;
}

export default function RequestDialog({
  subjects: initialSubjects,
  time: initialTime,
  onClosed,
  aspect,
  user,
}: RequestDialogProps): JSX.Element {
  const { orgs } = useOrgs();
  const { user: currentUser } = useUser();

  const [attendees, setAttendees] = useState<string[]>([
    user.id,
    currentUser.id,
  ]);
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [time, setTime] = useState<Timeslot | undefined>(initialTime);
  const [message, setMessage] = useState<string>('');

  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setSubmitted((prev: boolean) => prev && !submitting);
    setError((prev?: string) => (submitting ? undefined : prev));
  }, [submitting]);
  useEffect(() => {
    setSubmitting((prev: boolean) => prev && !submitted);
    setError((prev?: string) => (submitted ? undefined : prev));
  }, [submitted]);
  useEffect(() => {
    setSubmitting((prev: boolean) => prev && !error);
    setSubmitted((prev: boolean) => prev && !error);
  }, [error]);

  const msg: IntlHelper = useMsg();
  const appt: Appt = useMemo(
    () =>
      new Appt({
        time,
        message,
        subjects,
        attendees: attendees.map((id: string) => {
          const roles: RoleAlias[] = [];
          if (id === user.id) {
            roles.push(aspect === 'tutoring' ? 'tutor' : 'mentor');
          } else {
            roles.push(aspect === 'tutoring' ? 'tutee' : 'mentee');
          }
          return { id, roles, handle: uuid() };
        }),
      }),
    [time, message, subjects, attendees, user.id, aspect]
  );

  const onAttendeesChange = useCallback(
    (selected: string[]) => {
      let a: string[] = Array.from(selected);
      if (selected.indexOf(user.id) < 0) a = [user.id, ...selected];
      if (a.length < 2) a = [...selected, currentUser.id];
      setAttendees(a);
    },
    [user, currentUser]
  );

  const onSubjectsChange = useCallback((s: string[]) => setSubjects(s), []);

  const onTimeChange = useCallback((t: Timeslot) => setTime(t), []);

  const onMessageChange = useCallback((event: FormEvent<HTMLInputElement>) => {
    setMessage(event.currentTarget.value);
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setSubmitting(true);
      if (!currentUser.id) {
        const [err] = await to(signupWithGoogle(currentUser));
        if (err)
          return setError(
            `An error occurred while logging in with Google. ${err.message}`
          );
      }
      const [err] = await to<AxiosResponse<ApptJSON>, AxiosError<ApiError>>(
        axios.post('/api/appts', appt.toJSON())
      );
      if (err && err.response)
        return setError(
          `An error occurred while sending your request. ${Utils.period(
            err.response.data.msg || err.message
          )}`
        );
      if (err && err.request)
        return setError(
          'An error occurred while sending your request. Please check your Internet connection and try again.'
        );
      if (err)
        return setError(
          `An error occurred while sending your request. ${Utils.period(
            err.message
          )} Please check your Internet connection and try again.`
        );
      return setSubmitted(true);
    },
    [currentUser, appt]
  );

  return (
    <UserDialog
      onClosed={onClosed}
      submitting={submitting}
      submitted={submitted}
      user={user}
    >
      <h6 className={styles.header}>Request</h6>
      <form className={styles.form} onSubmit={onSubmit}>
        <UserSelect
          required
          outlined
          renderToPortal
          parents={[currentUser.id]}
          orgs={orgs.map((org: OrgJSON) => org.id)}
          label={msg(msgs.attendees)}
          className={styles.field}
          onChange={onAttendeesChange}
          value={attendees}
        />
        <SubjectSelect
          required
          outlined
          autoOpenMenu
          renderToPortal
          label={msg(msgs.subjects)}
          className={styles.field}
          onChange={onSubjectsChange}
          value={subjects}
          options={user[aspect].subjects}
          aspect={aspect}
        />
        {aspect === 'tutoring' && time && (
          <TimeslotInput
            required
            label={msg(msgs.time)}
            className={styles.field}
            onChange={onTimeChange}
            availability={user.availability}
            value={time}
          />
        )}
        <TextField
          outlined
          textarea
          rows={4}
          required
          characterCount
          maxLength={500}
          placeholder={msg(msgs.messagePlaceholder, {
            subject: subjects[0] || 'Computer Science',
          })}
          label={msg(msgs.message)}
          className={styles.field}
          onChange={onMessageChange}
          value={message}
        />
        <Button
          className={styles.button}
          label={
            !currentUser.id
              ? msg(msgs.signUpAndSubmit)
              : msg(msgs.submit, { name: user.firstName })
          }
          disabled={submitting || submitted}
          google={!currentUser.id}
          raised
          arrow
        />
        {!!error && (
          <TextFieldHelperText
            persistent
            validationMsg
            className={styles.error}
          >
            {error}
          </TextFieldHelperText>
        )}
      </form>
    </UserDialog>
  );
}
