import { useCallback, useEffect } from 'react';
import axios from 'axios';

import { Meeting, MeetingJSON, TCallback } from 'lib/model';
import { useContinuous } from 'lib/hooks';

import { useCalendar } from '../context';

import RndSurface from './surface';

export interface ExistingMeetingRndProps {
  now: Date;
  width: number;
  viewing: Meeting | undefined;
  setViewing: TCallback<Meeting | undefined>;
  dragging: boolean;
  setDragging: TCallback<boolean>;
  meeting: Meeting;
}

// Assumes meeting is in global `meetings` state context:
// - Mutates meeting in global state when changes occur.
// - Updates remote after a period of no change.
export default function ExistingMeetingRnd({
  now,
  width,
  viewing,
  setViewing,
  dragging,
  setDragging,
  meeting: initialData,
}: ExistingMeetingRndProps): JSX.Element {
  const updateRemote = useCallback(async (updated: Meeting) => {
    const url = `/api/meetings/${updated.id}`;
    const { data } = await axios.put<MeetingJSON>(url, updated.toJSON());
    return Meeting.fromJSON(data);
  }, []);

  const { mutateMeeting } = useCalendar();
  const { data: meeting, setData: setMeeting } = useContinuous(
    initialData,
    updateRemote,
    mutateMeeting
  );

  const onClick = useCallback(() => {
    if (!dragging) setViewing(meeting);
  }, [dragging, setViewing, meeting]);

  useEffect(() => {
    // Ensure `viewing` is always in sync with `meeting` b/c `useContinuous`
    // throttles local updates to 500ms (so the calendar page's global state
    // waterfall is not always up-to-date).
    if (viewing?.id === meeting.id) setViewing(meeting);
  }, [viewing, setViewing, meeting]);

  return (
    <RndSurface
      now={now}
      width={width}
      elevated={dragging || viewing?.id === meeting.id}
      meeting={meeting}
      setMeeting={setMeeting}
      dragging={dragging}
      setDragging={setDragging}
      onClick={onClick}
    />
  );
}
