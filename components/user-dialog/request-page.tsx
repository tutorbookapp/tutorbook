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
import { mutate } from 'swr';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Loader from 'components/loader';
import Button from 'components/button';
import Result from 'components/search/result';
import SubjectSelect, { SubjectOption } from 'components/subject-select';

import { ListRequestsRes } from 'lib/api/routes/requests/list';
import { useUser } from 'lib/account';
import Utils from 'lib/utils';
import {
  ApiError,
  Aspect,
  Callback,
  Person,
  Request,
  RequestJSON,
  User,
  UserJSON,
} from 'lib/model';

import styles from './form-page.module.scss';

export interface RequestPageProps {
  value: UserJSON;
  openDisplay: () => Promise<void>;
  setMatching: Callback<RequestJSON[]>;
  closeDialog: () => void;
}

export default memo(function RequestPage({
  value,
  openDisplay,
  setMatching,
  closeDialog,
}: RequestPageProps): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const aspects = useRef<Set<Aspect>>(new Set());
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [message, setMessage] = useState<string>('');

  const msgPlaceholder = useMemo(
    () =>
      t('request:message-placeholder', {
        student: value.name.split(' ')[0],
        subject: subjects[0] ? subjects[0].label : 'Computer Science',
      }),
    [t, subjects, value.name]
  );

  const onMessageChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    setMessage(evt.currentTarget.value);
  }, []);
  const onMessageFocus = useCallback(() => {
    setMessage((prev: string) => prev || msgPlaceholder.replace('Ex: ', ''));
  }, [t, subjects, value.name]);

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
    if (asps.includes('tutoring')) person.roles.push('tutee');
    if (asps.includes('mentoring')) person.roles.push('mentee');
    return new Request({
      id: `temp-${uuid()}`,
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
  }, [value, user, subjects, message]);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoading(true);

      // TODO: Locally mutate the data and close this dialog (that way, the app
      // feels faster even though we're really still creating the request). Show
      // a snackbar and remove the request is the HTTP POST fails.
      await mutate(
        '/api/requests',
        (prev?: ListRequestsRes) => {
          if (!prev) return { requests: [request.toJSON()], hits: 1 };
          return {
            requests: [request.toJSON(), ...prev.requests],
            hits: prev.hits + 1,
          };
        },
        false
      );

      const [err, res] = await to<
        AxiosResponse<RequestJSON>,
        AxiosError<ApiError>
      >(axios.post('/api/requests', request.toJSON()));

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
        const { data } = res as AxiosResponse<RequestJSON>;
        await mutate('/api/requests', (prev?: ListRequestsRes) => {
          if (!prev) return { requests: [data], hits: 1 };
          const idx = prev.requests.findIndex((r) => r.id === request.id);
          if (idx < 0) {
            console.warn(`[WARNING] Request (${request.id}) not found.`);
            return { requests: [data, ...prev.requests], hits: prev.hits + 1 };
          }
          const requests = [
            ...prev.requests.slice(0, idx),
            data,
            ...prev.requests.slice(idx + 1),
          ];
          return { requests, hits: prev.hits };
        });
        setMatching((prev: RequestJSON[]) => {
          const idx = prev.findIndex((r) => r.id === request.id);
          if (idx < 0) return prev;
          return [...prev.slice(0, idx), data, ...prev.slice(idx + 1)];
        });
        setChecked(true);
        // Wait one sec to show checkmark animation before hiding the loading
        // overlay and letting the user edit their newly created/updated user.
        setTimeout(closeDialog, 1000);
      }
    },
    [request, setMatching, closeDialog]
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
          <TextField
            textarea
            rows={4}
            required
            characterCount
            maxLength={700}
            label={t('common:message')}
            placeholder={msgPlaceholder}
            onChange={onMessageChange}
            onFocus={onMessageFocus}
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
