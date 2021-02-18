import { useCallback, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Meeting, Timeslot } from 'lib/model';
import { join } from 'lib/utils';
import { useClickContext } from 'lib/hooks/click-outside';

import styles from './content.module.scss';

export interface MeetingContentProps {
  meeting: Meeting;
  height: number;
}

export default function MeetingContent({
  meeting,
  height,
}: MeetingContentProps): JSX.Element {
  const { updateEl, removeEl } = useClickContext();
  const { lang: locale } = useTranslation();

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl(`rnd-${meeting.id}`);
      return updateEl(`rnd-${meeting.id}`, node);
    },
    [updateEl, removeEl, meeting.id]
  );

  const headerHeight = useMemo(() => Math.floor((height - 4) / 15) * 15, [
    height,
  ]);
  const timeString = useMemo(
    () =>
      `${(meeting.time || new Timeslot()).from.toLocaleString(locale, {
        hour: 'numeric',
        minute: 'numeric',
      })} - ${(meeting.time || new Timeslot()).to.toLocaleString(locale, {
        hour: 'numeric',
        minute: 'numeric',
      })}`,
    [meeting.time, locale]
  );

  return (
    <div ref={ref} className={styles.wrapper}>
      <div className={styles.content}>
        <div
          className={styles.header}
          style={{
            maxHeight: headerHeight > 30 ? headerHeight - 15 : 15,
            whiteSpace: headerHeight < 45 ? 'nowrap' : 'normal',
          }}
        >
          {!!meeting.match.subjects.length && (
            <span className={styles.subjects}>
              {join(meeting.match.subjects)}
            </span>
          )}
          {headerHeight < 30 && (
            <span className={styles.time}>
              {meeting.match.subjects.length ? `, ${timeString}` : timeString}
            </span>
          )}
        </div>
        {headerHeight > 15 && <div className={styles.time}>{timeString}</div>}
      </div>
    </div>
  );
}
