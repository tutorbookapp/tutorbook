import React, { memo, useState, useCallback } from 'react';
import Loader from 'components/loader';
import Button from 'components/button';
import Utils from 'lib/utils';

import { IconButton } from '@rmwc/icon-button';
import { MatchInputs } from 'components/inputs';
import { Match, MatchJSON, UserJSON, ApiError } from 'lib/model';
import { TextFieldHelperText } from '@rmwc/textfield';
import { useUser } from 'lib/account';

import axios, { AxiosResponse, AxiosError } from 'axios';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';
import { v4 as uuid } from 'uuid';

import styles from './request-page.module.scss';

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

  // TODO: Refactor the request inputs component such that we can fully control
  // the labels (i.e. the names) of each user. Right now, we're running extra
  // fetch requests to get those names (when we already have them here). Perhaps
  // just add a `name` property to the `Person` object and get it over with.
  const [match, setMatch] = useState<Match>(
    new Match({
      people: [
        { id: value.id, roles: ['tutor'], handle: uuid() },
        { id: user.id, roles: ['tutee'], handle: uuid() },
      ],
    })
  );

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
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

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <div className={styles.content}>
        <form className={styles.form} onSubmit={onSubmit}>
          <MatchInputs
            value={match}
            onChange={setMatch}
            renderToPortal
            className={styles.field}
            tutors
            tutees
            mentors
            mentees
            subjects
            times
            message
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
