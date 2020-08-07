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
  Match,
  MatchJSON,
  Person,
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

  const [students, setStudents] = useState<Option<string>[]>([
    { label: 'You', value: currentUser.id },
  ]);
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [times, setTimes] = useState<Availability | undefined>(initialTimes);
  const [message, setMessage] = useState<string>('');

  // We have to use React refs in order to access updated state information in
  // a callback that was called (and thus was also defined) before the update.
  const match = useRef<Match>(new Match());
  useEffect(() => {
    const creator: Person = {
      id: currentUser.id,
      handle: uuid(),
      roles: [],
    };
    const target: Person = {
      id: user.id,
      handle: uuid(),
      roles: [aspect === 'tutoring' ? 'tutor' : 'mentor'],
    };
    match.current = new Match({
      times,
      creator,
      message,
      subjects,
      people: [
        target,
        ...students.map(({ value: id }) => {
          const roles: Role[] = [aspect === 'tutoring' ? 'tutee' : 'mentee'];
          const handle: string = id === creator.id ? creator.handle : uuid();
          if (id === creator.id) creator.roles = Array.from(roles);
          return { id, roles, handle };
        }),
      ],
    });
  }, [currentUser.id, user.id, aspect, times, message, subjects, students]);

  // Update the names displayed in the people select when context or props
  // changes (i.e. when the user logs in, we change 'You' to their actual name).
  useEffect(() => {
    setStudents((prev: Option<string>[]) => {
      const opt = { label: 'You', value: currentUser.id };
      if (!prev.length) return [opt];
      const idx = prev.findIndex(({ value: id }) => !id || id === opt.value);
      if (idx < 0) return prev;
      return [...prev.slice(0, idx), opt, ...prev.slice(idx + 1)];
    });
  }, [currentUser]);

  // Ensure there are at least 2 people and that they always contain the
  // recipient of the request (i.e. the user being presented in this dialog).
  const onStudentsChange = useCallback(
    (selected: Option<string>[]) => {
      setStudents(() => {
        const updated: Option<string>[] = Array.from(selected);
        if (updated.length) return updated;
        return [{ label: 'You', value: currentUser.id }];
      });
    },
    [currentUser]
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
        if (err) {
          setLoading(false);
          setError(
            `An error occurred while logging in with Google. ${err.message}`
          );
          return;
        }
      }
      const [err] = await to<AxiosResponse<MatchJSON>, AxiosError<ApiError>>(
        axios.post('/api/matches', match.current.toJSON())
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
              content={t('match3rd:login-to-proxy-request')}
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
                  label={t('match3rd:people')}
                  className={styles.field}
                  onSelectedChange={onStudentsChange}
                  selected={students}
                />
              </div>
            </Tooltip>
            <SubjectSelect
              required
              outlined
              autoOpenMenu
              renderToPortal
              label={t('match3rd:subjects')}
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
                label={t('match3rd:times')}
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
              placeholder={t('match3rd:message-placeholder', {
                subject: subjects[0] || 'Computer Science',
              })}
              label={t('match3rd:message')}
              className={styles.field}
              onChange={onMessageChange}
              value={message}
            />
            <Button
              className={styles.button}
              label={
                !currentUser.id
                  ? t('match3rd:signup-btn')
                  : t('match3rd:send-btn')
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
