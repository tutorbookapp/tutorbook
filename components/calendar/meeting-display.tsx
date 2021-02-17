import cn from 'classnames';
import { useMemo } from 'react';

import { Meeting } from 'lib/model';

import { getHeight, getPosition } from './utils';
import MeetingContent from './rnds/content';
import styles from './meeting-display.module.scss';

export interface MeetingDisplayProps {
  now: Date;
  left: string;
  width: string;
  meeting: Meeting;
  elevated: boolean;
}

export default function MeetingDisplay({
  now,
  left,
  width,
  meeting,
  elevated,
}: MeetingDisplayProps): JSX.Element {
  const top = useMemo(() => getPosition(meeting.time.from).y, [
    meeting.time.from,
  ]);
  const height = useMemo(() => getHeight(meeting.time), [meeting.time]);

  return (
    <div
      style={{ top, left, width, height }}
      className={cn(styles.meeting, {
        [styles.elevated]: elevated,
        [styles.past]: meeting.time.to <= now,
      })}
    >
      <MeetingContent meeting={meeting} height={height} />
      <span>
        <div className={styles.bottom} />
        <div className={styles.top} />
      </span>
    </div>
  );
}
