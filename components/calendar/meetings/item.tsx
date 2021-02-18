import cn from 'classnames';
import { useMemo } from 'react';

import { Meeting, TCallback } from 'lib/model';

import { getHeight, getPosition } from '../utils';

import MeetingContent from './content';
import styles from './item.module.scss';

export interface MeetingItemProps {
  now: Date;
  meeting: Meeting;
  leftPercent: number;
  widthPercent: number;
  viewing?: Meeting;
  setViewing: TCallback<Meeting>;
  editing?: Meeting;
  setEditing: TCallback<Meeting>;
  setEditRndVisible: TCallback<boolean>;
}

export default function MeetingItem({
  now,
  meeting,
  leftPercent,
  widthPercent,
  viewing,
  setViewing,
  editing,
  setEditing,
  setEditRndVisible,
}: MeetingItemProps): JSX.Element {
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
      onMouseDown={(evt) => {
        evt.stopPropagation();
        setEditing(meeting);
        setEditRndVisible(true);
      }}
    >
      <MeetingContent meeting={meeting} height={height} />
      <span>
        <div
          className={styles.bottom}
          onMouseDown={(evt) => {
            evt.stopPropagation();
            setEditing(meeting);
            setEditRndVisible(true);
          }}
        />
        <div
          className={styles.top}
          onMouseDown={(evt) => {
            evt.stopPropagation();
            setEditing(meeting);
            setEditRndVisible(true);
          }}
        />
      </span>
    </div>
  );
}
