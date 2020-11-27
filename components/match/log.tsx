import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import { mutate } from 'swr';

import Button from 'components/button';
import Loader from 'components/loader';
import TimeSelect from 'components/time-select';

import {
  CallbackParam,
  Match,
  MatchJSON,
  Meeting,
  MeetingJSON,
  Timeslot,
} from 'lib/model';
import { useSingle } from 'lib/hooks';
import { useUser } from 'lib/context/user';

import styles from './log.module.scss';

export interface MatchLogProps {
  match?: Match;
}

export default function MatchLog({ match }: MatchLogProps): JSX.Element {
  // Creating a new meeting log allows users to easily update the next meeting
  // time (automatically sets it to next week at the same time).
  const [nextMeetingTime, setNextMeetingTime] = useState<Timeslot>();

  useEffect(() => {
    setNextMeetingTime((prev) => match?.time?.toNextWeek() || prev);
  }, [match?.time]);

  const updateNextMeetingTime = useCallback(async () => {
    if (!match) return;
    const url = `/api/matches/${match.id}`;
    const time = nextMeetingTime ? nextMeetingTime.toJSON() : null;
    const { data } = await axios.put<MatchJSON>(url, { ...match, time });
    await mutate(`/api/matches/${match.id}`, data, false);
  }, [match, nextMeetingTime]);

  const updateRemote = useCallback(
    async (updated: Meeting) => {
      if (!match) return;
      const url = `/api/matches/${match.id}/meetings`;
      await mutate(url, async (meetings: MeetingJSON[] = []) => {
        const { data } = await axios.post<MeetingJSON>(url, updated.toJSON());
        await updateNextMeetingTime();
        meetings.push(data);
        console.log(
          'Mutating meetings:',
          meetings.map((m) => Meeting.fromJSON(m).toString())
        );
        return meetings;
      });
      return updated;
    },
    [match, updateNextMeetingTime]
  );

  const { user } = useUser();
  const initialMeeting = useMemo(() => {
    const time = match?.time || new Timeslot();
    return new Meeting({ time, creator: user.toPerson() });
  }, [match?.time, user]);
  const {
    data: meeting,
    setData: setMeeting,
    onSubmit,
    checked,
    loading,
    error,
  } = useSingle(initialMeeting, updateRemote);

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
    <div className={styles.card}>
      <Loader active={loading} checked={checked} />
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
            characterCount
            maxLength={700}
            label='Meeting notes'
            placeholder='Ex: We chatted about Computer Science work.'
            onChange={onNotesChange}
            value={meeting.notes}
            className={styles.field}
            outlined
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <TimeSelect
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
    </div>
  );
}
