import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';

import {
  Callback,
  CallbackParam,
  Match,
  MatchJSON,
  TCallback,
  Timeslot,
} from 'lib/model';
import { usePrevious, useSingle } from 'lib/hooks';

import styles from './edit-page.module.scss';

export interface EditPageProps {
  match: MatchJSON;
  onChange: TCallback<MatchJSON>;
  setLoading: Callback<boolean>;
  setChecked: Callback<boolean>;
  setActive: Callback<number>;
}

export default function EditPage({
  match: matchJSON,
  onChange,
  setLoading,
  setChecked,
  setActive,
}: EditPageProps): JSX.Element {
  const updateLocal = useCallback(
    (updated: Match) => onChange(updated.toJSON()),
    [onChange]
  );

  const updateRemote = useCallback(async (updated: Match) => {
    if (updated.id.startsWith('temp')) {
      const json = { ...updated.toJSON(), id: '' };
      const { data } = await axios.post<MatchJSON>('/api/matches', json);
      return Match.fromJSON(data);
    }
    const url = `/api/matches/${updated.id}`;
    const { data } = await axios.put<MatchJSON>(url, updated.toJSON());
    return Match.fromJSON(data);
  }, []);

  const initialMatch = useMemo(() => Match.fromJSON(matchJSON), [matchJSON]);
  const {
    data: match,
    setData: setMatch,
    onSubmit,
    checked,
    loading,
    error,
  } = useSingle(initialMatch, updateRemote, updateLocal);

  useEffect(() => setLoading(loading), [setLoading, loading]);
  useEffect(() => setChecked(checked), [setChecked, checked]);

  const prevLoading = usePrevious(loading);
  useLayoutEffect(() => {
    if (prevLoading && !loading && !error) setActive(0);
  }, [prevLoading, loading, error, setActive]);

  const onSubjectsChange = useCallback(
    (subjects: string[]) => {
      setMatch((prev) => new Match({ ...prev, subjects }));
    },
    [setMatch]
  );
  const onTimeChange = useCallback(
    (param: CallbackParam<Timeslot | undefined>) => {
      setMatch((prev) => {
        let { time } = prev;
        if (typeof param === 'object') time = param;
        if (typeof param === 'function') time = param(time);
        return new Match({ ...prev, time });
      });
    },
    [setMatch]
  );

  const { t } = useTranslation();

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.inputs}>
        <SubjectSelect
          required
          autoOpenMenu
          label={t('common:subjects')}
          onChange={onSubjectsChange}
          value={match.subjects}
          className={styles.field}
          renderToPortal
          outlined
        />
        <TimeSelect
          required
          uid='volunteer'
          label={t('common:time')}
          onChange={onTimeChange}
          value={match.time}
          className={styles.field}
          renderToPortal
          outlined
        />
        <Button
          className={styles.btn}
          label={t('match:update-btn')}
          disabled={loading}
          raised
          arrow
        />
        {!!error && <div className={styles.error}>{error}</div>}
      </div>
    </form>
  );
}
