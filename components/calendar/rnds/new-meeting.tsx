import { Meeting, TCallback } from 'lib/model';

import RndSurface from './surface';

export interface NewMeetingRndProps {
  now: Date;
  width: number;
  viewing: Meeting;
  setViewing: TCallback<Meeting>;
  draggingId?: string;
  setDraggingId: TCallback<string | undefined>;
}

export default function NewMeetingRnd({
  now,
  width,
  viewing,
  setViewing,
  draggingId,
  setDraggingId,
}: NewMeetingRndProps): JSX.Element {
  return (
    <RndSurface
      now={now}
      width={width}
      elevated
      meeting={viewing}
      setMeeting={setViewing}
      draggingId={draggingId}
      setDraggingId={setDraggingId}
    />
  );
}
