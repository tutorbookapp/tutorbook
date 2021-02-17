import cn from 'classnames';
import { useMemo } from 'react';

import { Meeting, TCallback } from 'lib/model';

import { getHeight, getPosition } from './utils';
import MeetingContent from './rnds/content';
import styles from './meeting-display.module.scss';

export interface MeetingDisplayProps {
  now: Date;
  left: string;
  width: string;
  meeting: Meeting;
  viewing: Meeting | undefined;
  setViewing: TCallback<Meeting | undefined>;
}

export default function MeetingDisplay({
  now,
  left,
  width,
  meeting,
  viewing,
  setViewing,
}: MeetingDisplayProps): JSX.Element {
  const top = useMemo(() => getPosition(meeting.time.from).y, [
    meeting.time.from,
  ]);
  const height = useMemo(() => getHeight(meeting.time), [meeting.time]);

  return (
    <div
      style={{ top, left, width, height }}
      className={cn(styles.meeting, {
        [styles.elevated]: viewing?.id === meeting.id,
        [styles.past]: meeting.time.to <= now,
      })}
      onClick={(evt) => {
        evt.stopPropagation();
        setViewing(meeting);
      }}
    >
      <MeetingContent meeting={meeting} height={height} />
      <span>
        <div className={styles.bottom} />
        <div className={styles.top} />
      </span>
    </div>
  );
}
