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
import { dequal } from 'dequal/lite';
import { nanoid } from 'nanoid';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import { Callback, Match } from 'lib/model';
import { getDateWithTime, getNextDateWithDay } from 'lib/utils/time';
import { useClickOutside } from 'lib/hooks';

import MatchPreview from './match-preview';
import MatchRnd from './match-rnd';
import { getMatch } from './utils';
import styles from './calendar.module.scss';

export interface CalendarProps {
  matches: Match[];
  setMatches: Callback<Match[]>;
  searching: boolean;
}

/**
 * The `Calendar` emulates the drag-and-resize interface of Google
 * Calendar's event creation UI but on a much smaller scale. We use `react-rnd`
 * within an RMWC `MenuSurface` to craft our UX.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/50}
 */
export default function Calendar({
  matches,
  setMatches,
}: CalendarProps): JSX.Element {
  const { lang: locale } = useTranslation();

  const previewRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);

  const [cellsRef, { x, y }] = useMeasure({ polyfill, scroll: true });
  const [cellRef, { width }] = useMeasure({ polyfill });

  const [open, setOpen] = useState<boolean>(false);
  const [preview, setPreview] = useState<MatchPreviewProps>();
  const closingTimeoutId = useRef<ReturnType<typeof setTimeout>>();
  const onRndInteraction = useCallback(() => {
    if (closingTimeoutId.current) {
      clearTimeout(closingTimeoutId.current);
      closingTimeoutId.current = undefined;
    }
  }, []);
  const onRndDrag = useCallback(() => setOpen(false), []);

  useClickOutside(previewRef, () => {
    closingTimeoutId.current = setTimeout(() => setOpen(false), 0);
  });

  useEffect(() => {
    // Scroll to 8:30am by default (assumes 48px per hour).
    if (rowsRef.current) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, []);

  const updateMatch = useCallback(
    (idx: number, updated?: Match) => {
      setMatches((prev) => {
        if (!updated) return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        if (idx < 0) return [...prev, updated];
        return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
      });
    },
    [setMatches]
  );

  // Create a new `TimeslotRND` closest to the user's click position. Assumes
  // each column is 82px wide and every hour is 48px tall (i.e. 12px = 15min).
  const onClick = useCallback(
    (event: MouseEvent) => {
      const position = { x: event.clientX - x, y: event.clientY - y };
      const match = new Match({ id: `temp-${nanoid()}` });
      updateMatch(-1, getMatch(48, position, match, width));
    },
    [x, y, width, updateMatch]
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
        .map((_, weekday) => (
          <div key={nanoid()} className={styles.titleWrapper}>
            <h2 className={cn({ [styles.today]: weekday === 3 })}>
              <div className={styles.weekday}>
                {getNextDateWithDay(weekday).toLocaleString(locale, {
                  weekday: 'short',
                })}
              </div>
              <div className={styles.date}>
                {getNextDateWithDay(weekday).getDate()}
              </div>
            </h2>
          </div>
        )),
    [locale]
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
        .map(() => (
          <div key={nanoid()} className={styles.cell} ref={cellRef} />
        )),
    []
  );

  return (
    <>
      {preview && (
        <MatchPreview
          {...preview}
          width={width}
          ref={previewRef}
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
              <div className={styles.rows}>
                <div className={styles.lines}>{lineCells}</div>
                <div className={styles.space} />
                <div className={styles.cells} onClick={onClick} ref={cellsRef}>
                  {matches.map((match: Match, idx: number) => (
                    <MatchRnd
                      key={match.id}
                      value={match}
                      width={width}
                      onClick={(position, height) =>
                        setPreview({ match, position, height })
                      }
                      onChange={(updated) => updateMatch(idx, updated)}
                      onTouchStart={onRndInteraction}
                      onMouseDown={onRndInteraction}
                      onDrag={onRndDrag}
                    />
                  ))}
                  {dayCells}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
