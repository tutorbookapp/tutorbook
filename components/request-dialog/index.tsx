import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
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
  Option,
  OrgJSON,
  RoleAlias,
  Timeslot,
  Appt,
  ApptJSON,
  Attendee,
  Aspect,
} from 'lib/model';
import { Tooltip } from '@rmwc/tooltip';
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

  const [attendees, setAttendees] = useState<Option<string>[]>([
    { label: user.name, value: user.id },
    { label: currentUser.name || 'You', value: currentUser.id },
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

  // We have to use React refs in order to access updated state information in
  // a callback that was called (and thus was also defined) before the update.
  const appt = useRef<Appt>(new Appt());
  useEffect(() => {
    const creator: Attendee = { id: currentUser.id, handle: uuid(), roles: [] };
    appt.current = new Appt({
      time,
      creator,
      message,
      subjects,
      attendees: attendees.map(({ value: id }) => {
        const roles: RoleAlias[] = [];
        const handle: string = id === creator.id ? creator.handle : uuid();
        if (id === user.id) {
          roles.push(aspect === 'tutoring' ? 'tutor' : 'mentor');
        } else {
          roles.push(aspect === 'tutoring' ? 'tutee' : 'mentee');
        }
        if (id === creator.id) creator.roles = Array.from(roles);
        return { id, roles, handle };
      }),
    });
  }, [currentUser.id, user.id, aspect, time, message, subjects, attendees]);

  // Update the names displayed in the attendees select when context or props
  // changes (i.e. when the user logs in, we change 'You' to their actual name).
  useEffect(() => {
    setAttendees((prev: Option<string>[]) => {
      const opt = { label: currentUser.name || 'You', value: currentUser.id };
      if (prev.length < 2) return [...prev, opt];
      const idx = prev.findIndex(({ value: id }) => !id || id === opt.value);
      if (idx < 0) return prev;
      return [...prev.slice(0, idx), opt, ...prev.slice(idx + 1)];
    });
  }, [currentUser]);
  useEffect(() => {
    setAttendees((prev: Option<string>[]) => [
      { label: user.name, value: user.id },
      ...prev.slice(1),
    ]);
  }, [user]);

  // Ensure there are at least 2 attendees and that they always contain the
  // recipient of the request (i.e. the user being presented in this dialog).
  const onAttendeesChange = useCallback(
    (selected: Option<string>[]) => {
      let a: Option<string>[] = Array.from(selected);
      if (a.findIndex(({ value: id }) => id === user.id) < 0)
        a = [{ label: user.name, value: user.id }, ...a];
      if (a.length < 2)
        a = [...a, { label: currentUser.name || 'You', value: currentUser.id }];
      setAttendees(a);
    },
    [user, currentUser]
  );

  const onSubjectsChange = useCallback((s: string[]) => setSubjects(s), []);
  const onTimeChange = useCallback((t: Timeslot) => setTime(t), []);
  const onMessageChange = useCallback((event: FormEvent<HTMLInputElement>) => {
    setMessage(event.currentTarget.value);
  }, []);

  // Signup the user via a Google Popup window if they aren't current logged in
  // **before** sending the request (this will trigger an update app-wide).
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
        axios.post('/api/appts', appt.current.toJSON())
      );
      if (err && err.response)
        return setError(
          `An error occurred while sending your request. ${Utils.period(
            err.response.data.msg || err.message
          )}`
        );
      if (err && err.request)
        return setError(
          'An error occurred while sending your request. Please check your ' +
            'Internet connection and try again.'
        );
      if (err)
        return setError(
          `An error occurred while sending your request. ${Utils.period(
            err.message
          )} Please check your Internet connection and try again.`
        );
      return setSubmitted(true);
    },
    [currentUser]
  );

  const msg: IntlHelper = useMsg();

  return (
    <UserDialog
      onClosed={onClosed}
      submitting={submitting}
      submitted={submitted}
      user={user}
    >
      <h6 className={styles.header}>Request</h6>
      <form className={styles.form} onSubmit={onSubmit}>
        <Tooltip
          content='You must be logged in to send requests for others'
          open={!currentUser.id ? undefined : false}
          activateOn='hover'
          align='topRight'
        >
          <div className={styles.field}>
            <UserSelect
              required
              outlined
              renderToPortal
              disabled={!currentUser.id}
              parents={currentUser.id ? [currentUser.id] : undefined}
              orgs={
                orgs.length ? orgs.map((org: OrgJSON) => org.id) : undefined
              }
              label={msg(msgs.attendees)}
              className={styles.field}
              onSelectedChange={onAttendeesChange}
              selected={attendees}
            />
          </div>
        </Tooltip>
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
