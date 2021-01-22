import { Callback, Meeting } from 'lib/model';

import RndSurface from './surface';

export interface NewMeetingRndProps {
  now: Date;
  width: number;
  viewing: Meeting;
  setViewing: Callback<Meeting>;
  dragging: boolean;
  setDragging: Callback<boolean>;
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
      onClick={() => {}}
    />
  );
}
