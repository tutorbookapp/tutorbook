import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Dialog } from '@rmwc/dialog';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Avatar from 'components/avatar';
import Button from 'components/button';
import Loader from 'components/loader';
import SubjectSelect from 'components/subject-select';

import Utils from 'lib/utils';
import { signupWithGoogle } from 'lib/account/signup';
import { useUser } from 'lib/account';
import {
  ApiError,
  Aspect,
  Match,
  MatchJSON,
  Person,
  SocialInterface,
  User,
} from 'lib/model';

import styles from './request-dialog.module.scss';

export interface RequestDialogProps {
  onClosed: () => void;
  subjects: string[];
  aspect: Aspect;
  user: User;
}

export default function RequestDialog({
  subjects: initialSubjects,
  onClosed,
  aspect,
  user,
}: RequestDialogProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const { t } = useTranslation();
  const { user: currentUser } = useUser();

  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [message, setMessage] = useState<string>('');

  // We have to use React refs in order to access updated state information in
  // a callback that was called (and thus was also defined) before the update.
  const match = useRef<Match>(new Match());
  useEffect(() => {
    const creator: Person = {
      id: currentUser.id,
      name: currentUser.name,
      photo: currentUser.photo,
      handle: uuid(),
      roles: [aspect === 'tutoring' ? 'tutee' : 'mentee'],
    };
    const target: Person = {
      id: user.id,
      name: user.name,
      photo: user.photo,
      handle: uuid(),
      roles: [aspect === 'tutoring' ? 'tutor' : 'mentor'],
    };
    match.current = new Match({
      creator,
      message,
      subjects,
      people: [target, creator],
    });
  }, [currentUser, user, aspect, message, subjects]);

  const onSubjectsChange = useCallback((s: string[]) => setSubjects(s), []);
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
        setTimeout(() => setOpen(false), 1000);
      }
    },
    [currentUser]
  );

  return (
    <Dialog open={open} onClosed={onClosed} className={styles.dialog}>
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
