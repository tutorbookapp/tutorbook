import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import SubjectSelect, { SubjectOption } from 'components/subject-select';

import { useUser } from 'lib/account';
import Utils from 'lib/utils';
import {
  ApiError,
  Aspect,
  Availability,
  Person,
  Request,
  RequestJSON,
  User,
  UserJSON,
} from 'lib/model';

import styles from './form-page.module.scss';

const TimesSelect = dynamic<TimesSelectProps>(async () =>
  import('components/times-select')
);

export interface RequestPageProps {
  value: UserJSON;
  openDisplay: () => Promise<void>;
}

export default memo(function RequestPage({
  value,
  openDisplay,
}: RequestPageProps): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const aspects = useRef<Set<Aspect>>(new Set());
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [times, setTimes] = useState<Availability>(new Availability());
  const [message, setMessage] = useState<string>('');

  const onMessageChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    setMessage(evt.currentTarget.value);
  }, []);

  useEffect(() => {
    subjects.forEach((s) => {
      if (s.aspect) aspects.current.add(s.aspect);
    });
  }, [subjects]);

  const request = useMemo(() => {
    const asps: Aspect[] = [...aspects.current];
    const person: Person = {
      id: value.id,
      name: value.name,
      photo: value.photo,
      roles: [],
      handle: uuid(),
    };
    if (asps.includes('tutoring')) person.roles.push('tutor');
    if (asps.includes('mentoring')) person.roles.push('mentor');
    return new Request({
      times,
      message,
      people: [person],
      subjects: subjects.map((s) => s.value),
      creator: {
        id: user.id,
        name: user.name,
        photo: user.photo,
        roles: [],
        handle: uuid(),
      },
      status: 'queued',
    });
  }, [value, user, subjects, times, message]);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);
      const [err] = await to<AxiosResponse<RequestJSON>, AxiosError<ApiError>>(
        axios.post('/api/requests', request.toJSON())
      );
      if (err && err.response) {
        setLoading(false);
        setError(
          `An error occurred while creating your request. ${Utils.period(
            err.response.data.msg || err.message
          )}`
        );
      } else if (err && err.request) {
        setLoading(false);
        setError(
          'An error occurred while creating your request. Please check your ' +
            'Internet connection and try again.'
        );
      } else if (err) {
        setLoading(false);
        setError(
          `An error occurred while creating your request. ${Utils.period(
            err.message
          )} Please check your Internet connection and try again.`
        );
      } else {
        setChecked(true);
      }
    },
    [request]
  );

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <div className={styles.content}>
        <Result user={User.fromJSON(value)} className={styles.display} />
        <form className={styles.form} onSubmit={onSubmit}>
          <SubjectSelect
            required
            autoOpenMenu
            options={[...value.tutoring.searches, ...value.mentoring.searches]}
            label={t('common:subjects')}
            onSelectedChange={setSubjects}
            selected={subjects}
            className={styles.field}
            renderToPortal
            outlined
          />
          <TimesSelect
            label={t('common:times')}
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
            label={t('common:message')}
            placeholder={t('request:message-placeholder', {
              student: value.name.split(' ')[0],
              subject: subjects[0] ? subjects[0].label : 'Computer Science',
            })}
            onChange={onMessageChange}
            value={message}
            className={styles.field}
            outlined
          />
          <Button
            className={styles.btn}
            label={t('request:create-btn')}
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
