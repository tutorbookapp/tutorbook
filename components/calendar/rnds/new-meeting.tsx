import { Meeting, TCallback } from 'lib/model';

import RndSurface from './surface';

export interface NewMeetingRndProps {
  now: Date;
  width: number;
  viewing: Meeting;
  setViewing: TCallback<Meeting>;
  dragging: boolean;
  setDragging: TCallback<boolean>;
}

export default function NewMeetingRnd({
  now,
  width,
  viewing,
  setViewing,
  dragging,
  setDragging,
}: NewMeetingRndProps): JSX.Element {
  return (
    <RndSurface
      now={now}
      width={width}
      elevated
      meeting={viewing}
      setMeeting={setViewing}
      dragging={dragging}
      setDragging={setDragging}
    />
  );
}
