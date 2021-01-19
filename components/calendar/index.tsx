import {
  MouseEvent,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import cn from 'classnames';
import { nanoid } from 'nanoid';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import LoadingDots from 'components/loading-dots';

import { Meeting, Position } from 'lib/model';
import { getDateWithDay, getDateWithTime } from 'lib/utils/time';
import { ClickContext } from 'lib/hooks/click-outside';
import { useClickOutside } from 'lib/hooks';

import { getMeeting, getPosition } from './utils';
import MeetingPreview from './preview';
import MeetingRnd from './rnd';
import styles from './calendar.module.scss';
import { useCalendar } from './context';

export interface CalendarBodyProps {
  searching: boolean;
  meetings: Meeting[];
}

export default function CalendarBody({
  searching,
  meetings,
}: CalendarBodyProps): JSX.Element {
  const { lang: locale } = useTranslation();
  const { startingDate } = useCalendar();

  const headerRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);

  const [cellsRef, { x, y }] = useMeasure({ polyfill, scroll: true });
  const [cellRef, { width }] = useMeasure({ polyfill });

  const [now, setNow] = useState<Date>(new Date());
  const [open, setOpen] = useState<boolean>(false);
  const [preview, setPreview] = useState<{
    meeting: Meeting;
    position: Position;
    height: number;
  }>();
  const closePreview = useCallback(() => setOpen(false), []);
  const { updateEl, removeEl } = useClickOutside(closePreview, open);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!meetings.some((m) => m.id === preview?.meeting.id)) setOpen(false);
  }, [meetings, preview?.meeting.id]);

  useEffect(() => {
    // Scroll to 8:30am by default (assumes 48px per hour).
    if (rowsRef.current) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, []);

  // Create a new `TimeslotRND` closest to the user's click position. Assumes
  // each column is 82px wide and every hour is 48px tall (i.e. 12px = 15min).
  const onClick = useCallback(
    (event: MouseEvent) => {
      const position = { x: event.clientX - x, y: event.clientY - y };
      const meeting = new Meeting({ id: `temp-${nanoid()}` });
      const created = getMeeting(48, position, meeting, width, startingDate);
      console.log('Clicked:', created.toJSON());
    },
    [startingDate, x, y, width]
  );

  // Sync the scroll position of the main cell grid and the static headers. This
  // was inspired by the way that Google Calendar's UI is currently setup.
  // @see {@link https://mzl.la/35OIC9y}
  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (!ticking.current) {
      requestAnimationFrame(() => {
        if (timesRef.current) timesRef.current.scrollTop = scrollTop;
        if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  const weekdayCells = useMemo(
    () =>
      Array(7)
        .fill(null)
        .map((_, day) => {
          const date = getDateWithDay(day, startingDate);
          const today =
            now.getFullYear() === date.getFullYear() &&
            now.getMonth() === date.getMonth() &&
            now.getDate() === date.getDate();
          return (
            <div key={nanoid()} className={styles.titleWrapper}>
              <h2 className={cn({ [styles.today]: today })}>
                <div className={styles.weekday}>
                  {date.toLocaleString(locale, { weekday: 'short' })}
                </div>
                <div className={styles.date}>{date.getDate()}</div>
              </h2>
            </div>
          );
        }),
    [now, locale, startingDate]
  );
  const timeCells = useMemo(
    () =>
      Array(24)
        .fill(null)
        .map((_, hour) => (
          <div key={nanoid()} className={styles.timeWrapper}>
            <span className={styles.timeLabel}>
              {getDateWithTime(hour).toLocaleString(locale, {
                hour: '2-digit',
              })}
            </span>
          </div>
        )),
    [locale]
  );
  const headerCells = useMemo(
    () =>
      Array(7)
        .fill(null)
        .map(() => <div key={nanoid()} className={styles.headerCell} />),
    []
  );
  const lineCells = useMemo(
    () =>
      Array(24)
        .fill(null)
        .map(() => <div key={nanoid()} className={styles.line} />),
    []
  );
  const dayCells = useMemo(
    () =>
      Array(7)
        .fill(null)
        .map((_, day) => {
          const date = getDateWithDay(day, startingDate);
          const today =
            now.getFullYear() === date.getFullYear() &&
            now.getMonth() === date.getMonth() &&
            now.getDate() === date.getDate();
          const { y: top } = getPosition(now);
          return (
            <div key={nanoid()} className={styles.cell} ref={cellRef}>
              {today && (
                <div style={{ top }} className={styles.indicator}>
                  <div className={styles.dot} />
                  <div className={styles.line} />
                </div>
              )}
            </div>
          );
        }),
    [now, cellRef]
  );

  return (
    <ClickContext.Provider value={{ updateEl, removeEl }}>
      {preview && (
        <MeetingPreview
          {...preview}
          width={width}
          offset={{ x, y }}
          onClosed={() => setPreview(undefined)}
          setOpen={setOpen}
          open={open}
        />
      )}
      <div className={styles.calendar}>
        <div className={styles.headerWrapper}>
          <div ref={headerRef} className={styles.headerContent}>
            <div className={styles.headers}>{weekdayCells}</div>
            <div className={styles.headerCells}>{headerCells}</div>
          </div>
          <div className={styles.scroller} />
        </div>
        <div className={styles.gridWrapper}>
          <div className={styles.grid}>
            <div className={styles.timesWrapper} ref={timesRef}>
              <div className={styles.times}>{timeCells}</div>
            </div>
            <div
              className={styles.rowsWrapper}
              onScroll={onScroll}
              ref={rowsRef}
            >
              {searching && (
                <div className={styles.loader}>
                  <LoadingDots size={4} />
                </div>
              )}
              <div className={styles.rows}>
                <div className={styles.lines}>{lineCells}</div>
                <div className={styles.space} />
                <div className={styles.cells} onClick={onClick} ref={cellsRef}>
                  {!searching &&
                    meetings.map((meeting: Meeting) => (
                      <MeetingRnd
                        key={meeting.id}
                        width={width}
                        meeting={meeting}
                        preview={preview}
                        setPreview={setPreview}
                        closePreview={closePreview}
                      />
                    ))}
                  {dayCells}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClickContext.Provider>
  );
}
