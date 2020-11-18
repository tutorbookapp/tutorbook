import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';

import Button from 'components/button';
import TimeSelect from 'components/time-select';

import {
  Callback,
  CallbackParam,
  MatchJSON,
  Meeting,
  MeetingJSON,
  TCallback,
  Timeslot,
} from 'lib/model';
import { usePrevious, useSingle } from 'lib/hooks';
import { useUser } from 'lib/context/user';

import styles from './edit-page.module.scss';

export interface LogMeetingPageProps {
  match: MatchJSON;
  onChange: TCallback<MatchJSON>;
  setLoading: Callback<boolean>;
  setChecked: Callback<boolean>;
  setActive: Callback<number>;
}

export default function LogMeetingPage({
  match,
  onChange,
  setLoading,
  setChecked,
  setActive,
}: LogMeetingPageProps): JSX.Element {
  // Creating a new meeting log allows users to easily update the next meeting
  // time (automatically sets it to next week at the same time).
  const [nextMeetingTime, setNextMeetingTime] = useState<Timeslot | undefined>(
    match.time ? Timeslot.fromJSON(match.time).toNextWeek() : undefined
  );
  const updateNextMeetingTime = useCallback(async () => {
    const url = `/api/matches/${match.id}`;
    const time = nextMeetingTime ? nextMeetingTime.toJSON() : null;
    const { data } = await axios.put<MatchJSON>(url, { ...match, time });
    onChange(data);
  }, [match, onChange, nextMeetingTime]);

  const updateRemote = useCallback(
    async (updated: Meeting) => {
      const url = `/api/matches/${match.id}/meetings`;
      const { data } = await axios.post<MeetingJSON>(url, updated.toJSON());
      await updateNextMeetingTime();
      return Meeting.fromJSON(data);
    },
    [match.id, updateNextMeetingTime]
  );

  const { user } = useUser();
  const initialMeeting = useMemo(() => {
    const time = match.time ? Timeslot.fromJSON(match.time) : new Timeslot();
    return new Meeting({ time, creator: user.toPerson() });
  }, [match.time, user]);
  const {
    data: meeting,
    setData: setMeeting,
    onSubmit,
    checked,
    loading,
    error,
  } = useSingle(initialMeeting, updateRemote);

  useEffect(() => setLoading(loading), [setLoading, loading]);
  useEffect(() => setChecked(checked), [setChecked, checked]);

  const prevLoading = usePrevious(loading);
  useLayoutEffect(() => {
    if (prevLoading && !loading && !error) setActive(0);
  }, [prevLoading, loading, error, setActive]);

  const onTimeChange = useCallback(
    (param: CallbackParam<Timeslot | undefined>) => {
      setMeeting((prev) => {
        let { time } = prev;
        if (typeof param === 'object') time = param;
        if (typeof param === 'function') time = param(time) || time;
        return new Meeting({ ...prev, time });
      });
    },
    [setMeeting]
  );
  const onNotesChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const notes = evt.currentTarget.value;
      setMeeting((prev) => new Meeting({ ...prev, notes }));
    },
    [setMeeting]
  );

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.inputs}>
        <TimeSelect
          required
          label='Meeting time'
          onChange={onTimeChange}
          value={meeting.time}
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
          label='Meeting notes'
          placeholder='Ex: We chatted about Computer Science work.'
          onChange={onNotesChange}
          value={meeting.notes}
          className={styles.field}
          outlined
        />
        <TimeSelect
          required
          label='Next meeting time'
          onChange={setNextMeetingTime}
          value={nextMeetingTime}
          className={styles.field}
          renderToPortal
          outlined
        />
        <Button
          className={styles.btn}
          label='Create meeting log'
          disabled={loading}
          raised
          arrow
        />
        {!!error && <div className={styles.error}>{error}</div>}
      </div>
    </form>
  );
}
