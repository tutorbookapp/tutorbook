import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  FormEvent,
} from 'react';
import Utils from 'lib/utils';
import Avatar from 'components/avatar';
import Loader from 'components/loader';
import Button from 'components/button';
import SubjectSelect from 'components/subject-select';
import UserSelect from 'components/user-select';

import { Dialog } from '@rmwc/dialog';
import {
  User,
  ApiError,
  SocialInterface,
  Option,
  Role,
  Availability,
  Appt,
  ApptJSON,
  Attendee,
  Aspect,
} from 'lib/model';
import { signupWithGoogle } from 'lib/account/signup';
import { useUser } from 'lib/account';
import { TooltipProps } from '@rmwc/tooltip';
import { TimesSelectProps } from 'components/times-select';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';

import useTranslation from 'next-translate/useTranslation';
import dynamic from 'next/dynamic';
import to from 'await-to-js';

import styles from './request-dialog.module.scss';

const TimesSelect = dynamic<TimesSelectProps>(() =>
  import('components/times-select')
);
const Tooltip = dynamic<TooltipProps>(() =>
  import('@rmwc/tooltip').then((m) => m.Tooltip)
);

export interface RequestDialogProps {
  onClosed: () => void;
  subjects: string[];
  times?: Availability;
  aspect: Aspect;
  user: User;
}

export default function RequestDialog({
  subjects: initialSubjects,
  times: initialTimes,
  onClosed,
  aspect,
  user,
}: RequestDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const { t } = useTranslation();
  const { user: currentUser } = useUser();

  const [attendees, setAttendees] = useState<Option<string>[]>([
    { label: user.name, value: user.id },
    { label: currentUser.name || 'You', value: currentUser.id },
  ]);
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [times, setTimes] = useState<Availability | undefined>(initialTimes);
  const [message, setMessage] = useState<string>('');

  // We have to use React refs in order to access updated state information in
  // a callback that was called (and thus was also defined) before the update.
  const appt = useRef<Appt>(new Appt());
  useEffect(() => {
    const creator: Attendee = { id: currentUser.id, handle: uuid(), roles: [] };
    appt.current = new Appt({
      times,
      creator,
      message,
      subjects,
      attendees: attendees.map(({ value: id }) => {
        const roles: Role[] = [];
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
  }, [currentUser.id, user.id, aspect, times, message, subjects, attendees]);

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
  const onTimesChange = useCallback((a: Availability) => setTimes(a), []);
  const onMessageChange = useCallback((event: FormEvent<HTMLInputElement>) => {
    setMessage(event.currentTarget.value);
  }, []);

  // Signup the user via a Google Popup window if they aren't current logged in
  // **before** sending the request (this will trigger an update app-wide).
  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
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
      if (err && err.response) {
        setLoading(false);
        setError(
          `An error occurred while sending your request. ${Utils.period(
            err.response.data.msg || err.message
          )}`
        );
      } else if (err && err.request) {
        setLoading(false);
        setError(
          'An error occurred while sending your request. Please check your ' +
            'Internet connection and try again.'
        );
      } else if (err) {
        setLoading(false);
        setError(
          `An error occurred while sending your request. ${Utils.period(
            err.message
          )} Please check your Internet connection and try again.`
        );
      } else {
        setChecked(true);
      }
    },
    [currentUser]
  );

  return (
    <Dialog open onClosed={onClosed} className={styles.dialog}>
      <div className={styles.wrapper}>
        <Loader active={loading} checked={checked} />
        <div className={styles.left}>
          <a
            className={styles.img}
            href={user.photo}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar src={user.photo} />
          </a>
          <h4 className={styles.name}>{user.name}</h4>
          {user.socials && !!user.socials.length && (
            <div className={styles.socials}>
              {user.socials.map((social: SocialInterface) => (
                <a
                  key={social.type}
                  target='_blank'
                  rel='noreferrer'
                  href={social.url}
                  className={`${styles.socialLink} ${styles[social.type]}`}
                >
                  {social.type}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className={styles.right}>
          <h6 className={styles.header}>{t('common:about')}</h6>
          <p className={styles.text}>{user.bio}</p>
          <h6 className={styles.header}>{t('common:request')}</h6>
          <form className={styles.form} onSubmit={onSubmit}>
            <Tooltip
              content={t('appt3rd:login-to-proxy-request')}
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
                  label={t('appt3rd:attendees')}
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
              label={t('appt3rd:subjects')}
              className={styles.field}
              onChange={onSubjectsChange}
              value={subjects}
              options={user[aspect].subjects}
              aspect={aspect}
            />
            {aspect === 'tutoring' && times && (
              <TimesSelect
                outlined
                renderToPortal
                label={t('appt3rd:times')}
                className={styles.field}
                onChange={onTimesChange}
                options={user.availability}
                value={times}
              />
            )}
            <TextField
              outlined
              textarea
              rows={4}
              required
              characterCount
              maxLength={500}
              placeholder={t('appt3rd:message-placeholder', {
                subject: subjects[0] || 'Computer Science',
              })}
              label={t('appt3rd:message')}
              className={styles.field}
              onChange={onMessageChange}
              value={message}
            />
            <Button
              className={styles.button}
              label={
                !currentUser.id
                  ? t('appt3rd:signup-btn')
                  : t('appt3rd:send-btn')
              }
              disabled={loading}
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
        </div>
      </div>
    </Dialog>
  );
}
