import cn from 'classnames';
import { useMemo } from 'react';

import { Meeting, TCallback } from 'lib/model';

import { getHeight, getPosition } from './utils';
import MeetingContent from './rnds/content';
import styles from './meeting-display.module.scss';

export interface MeetingDisplayProps {
  now: Date;
  leftPercent: number;
  widthPercent: number;
  meeting: Meeting;
  viewing: Meeting | undefined;
  setViewing: TCallback<Meeting | undefined>;
}

export default function MeetingDisplay({
  now,
  leftPercent,
  widthPercent,
  meeting,
  viewing,
  setViewing,
}: MeetingDisplayProps): JSX.Element {
  const top = useMemo(() => getPosition(meeting.time.from).y, [
    meeting.time.from,
  ]);
  const left = useMemo(() => {
    if (leftPercent === 0) return '-1px';
    return `calc(${leftPercent * 100}% + 1px)`;
  }, [leftPercent]);
  const width = useMemo(() => {
    if (leftPercent === 0) return `calc(${widthPercent * 100}% + 1px)`;
    return `calc(${widthPercent * 100}% - 1px)`;
  }, [leftPercent, widthPercent]);
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
