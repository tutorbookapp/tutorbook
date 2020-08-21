import { FormEvent, memo, useCallback, useState } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import { IconButton } from '@rmwc/icon-button';
import to from 'await-to-js';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import { TimesSelectProps } from 'components/times-select';
import Loader from 'components/loader';
import Button from 'components/button';
import Result from 'components/search/result';
import UserSelect from 'components/user-select';
import SubjectSelect from 'components/subject-select';

import { useUser } from 'lib/account';
import Utils from 'lib/utils';
import {
  Availability,
  ApiError,
  TimeslotJSON,
  Match,
  MatchJSON,
  RequestJSON,
  User,
  UserJSON,
  Person,
  Option,
} from 'lib/model';

import styles from './match-page.module.scss';

const TimesSelect = dynamic<TimesSelectProps>(async () =>
  import('components/times-select')
);

export interface MatchPageProps {
  value: UserJSON;
  matching: RequestJSON[];
  openDisplay: () => Promise<void>;
}

export default memo(function MatchPage({
  value,
  matching,
  openDisplay,
}: MatchPageProps): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [match, setMatch] = useState<Match>(() => {
    const people: Person[] = [
      {
        id: value.id,
        name: value.name,
        photo: value.photo,
        roles: ['tutor'],
        handle: uuid(),
      },
    ];
    const subjects: Set<string> = new Set();
    const times: TimeslotJSON[] = [];
    let message = '';
    matching.forEach((m: RequestJSON) => {
      m.people.forEach((person: Person) => {
        if (people.findIndex((p) => p.id === person.id) >= 0) return;
        people.push(person);
      });
      m.subjects.forEach((subject: string) => subjects.add(subject));
      if (m.times) m.times.forEach((time: TimeslotJSON) => times.push(time));
      message +=
        !m.message.endsWith(' ') && !message ? `${m.message} ` : m.message;
    });
    return new Match({
      people,
      message,
      subjects: [...subjects],
      times: Availability.fromJSON(times),
      creator: {
        id: user.id,
        name: user.name,
        photo: user.photo,
        roles: [],
        handle: uuid(),
      },
    });
  });

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);
      const [err] = await to<AxiosResponse<MatchJSON>, AxiosError<ApiError>>(
        axios.post('/api/matches', match.toJSON())
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
    [match]
  );

  const [students, setStudents] = useState<Option<string>[]>([]);
  const [subjects, setSubjects] = useState<Option<string>[]>([]);
  const [times, setTimes] = useState<Availability>(new Availability());
  const [message, setMessage] = useState<string>('');

  const onMessageChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    setMessage(evt.currentTarget.value);
  }, []);

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <div className={styles.content}>
        <Result user={User.fromJSON(value)} className={styles.display} />
        <form className={styles.form} onSubmit={onSubmit}>
          <UserSelect
            label={t('common:tutors')}
            onSelectedChange={setStudents}
            selected={students}
            className={styles.field}
            renderToPortal
            outlined
          />
          <SubjectSelect
            required
            autoOpenMenu
            options={[...value.tutoring.subjects, ...value.mentoring.subjects]}
            label={t('match:subjects')}
            onSelectedChange={setSubjects}
            selected={subjects}
            className={styles.field}
            renderToPortal
            outlined
          />
          <TimesSelect
            label={t('match:times')}
            onChange={setTimes}
            value={times}
            className={styles.field}
            renderToPortal
            outlined
          />
          <TextField
            textarea
            rows={4}
            required
            characterCount
            maxLength={700}
            label={t('match:message')}
            placeholder={t('match:message-placeholder', {
              subject: subjects[0] ? subjects[0].label : 'Computer Science',
            })}
            onChange={onMessageChange}
            value={message}
            className={styles.field}
            outlined
          />
          <Button
            className={styles.btn}
            label={t('match:send-btn')}
            disabled={loading}
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
  );
});
