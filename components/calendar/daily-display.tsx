import {
  MouseEvent,
  UIEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { animated, useSpring } from 'react-spring';
import cn from 'classnames';
import mergeRefs from 'react-merge-refs';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import LoadingDots from 'components/loading-dots';

import { Callback } from 'lib/model/callback';
import { Meeting } from 'lib/model/meeting';
import { Position } from 'lib/model/position';
import { useClickContext } from 'lib/hooks/click-outside';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import { DialogPage, useCalendarState } from './state';
import { Lines, Times } from './components';
import { MouseEventHackData, MouseEventHackTarget } from './hack-types';
import { config, width } from './spring-animation';
import { expand, placeMeetingsInDay } from './place-meetings';
import { getMeeting, getPosition } from './utils';
import MeetingItem from './meetings/item';
import MeetingRnd from './meetings/rnd';
import styles from './display.module.scss';

export interface DailyDisplayProps {
  searching: boolean;
  meetings: Meeting[];
  filtersOpen: boolean;
  width: number;
  setWidth: Callback<number>;
  offset: Position;
  setOffset: Callback<Position>;
}

function DailyDisplay({
  searching,
  meetings,
  filtersOpen,
  width: cellWidth,
  setWidth: setCellWidth,
  offset,
  setOffset,
}: DailyDisplayProps): JSX.Element {
  const [cellsMeasureIsCorrect, setCellsMeasureIsCorrect] = useState(false);
  const [rowsMeasureRef, rowsMeasure] = useMeasure({ polyfill });
  const [cellsMeasureRef, cellsMeasure] = useMeasure({
    polyfill,
    scroll: true,
  });
  const [cellMeasureRef, cellMeasure] = useMeasure({ polyfill });

  useEffect(() => {
    setCellWidth(cellMeasure.width);
  }, [setCellWidth, cellMeasure.width]);

  // See: https://github.com/pmndrs/react-use-measure/issues/37
  // Current workaround is to listen for scrolls on the parent div. Once
  // the user scrolls, we know that the `rowsMeasure.x` is no longer correct
  // but that the `cellsMeasure.x` is correct.
  useEffect(() => {
    setOffset({
      x: cellsMeasureIsCorrect ? cellsMeasure.x : rowsMeasure.x + 8,
      y: cellsMeasure.y,
    });
  }, [
    setOffset,
    cellsMeasureIsCorrect,
    cellsMeasure.x,
    cellsMeasure.y,
    rowsMeasure.x,
  ]);

  useEffect(() => {
    setCellsMeasureIsCorrect(false);
  }, [filtersOpen]);

  // Scroll to 8:30am by default (assumes 48px per hour).
  const rowsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rowsRef.current) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, []);

  const {
    rnd,
    setRnd,
    setEditing,
    dragging,
    setDialog,
    setDialogPage,
    start,
  } = useCalendarState();

  const [eventTarget, setEventTarget] = useState<MouseEventHackTarget>();
  const [eventData, setEventData] = useState<MouseEventHackData>();

  // Create a new `TimeslotRND` closest to the user's click position. Assumes
  // each column is 82px wide and every hour is 48px tall (i.e. 12px = 15min).
  const { user } = useUser();
  const { org } = useOrg();
  const onClick = useCallback(
    (event: MouseEvent) => {
      if (dragging) return;
      const pos = { x: event.clientX - offset.x, y: event.clientY - offset.y };
      const orgId = org ? org.id : user.orgs[0] || 'default';
      const creating = new Meeting({ id: 0, creator: user, org: orgId });
      setEventTarget(undefined);
      setEventData(undefined);
      setEditing(getMeeting(48, pos, creating, cellWidth, start));
      setDialogPage(DialogPage.Create);
      setDialog(true);
      setRnd(true);
    },
    [
      org,
      user,
      setEditing,
      setDialog,
      setDialogPage,
      setRnd,
      dragging,
      start,
      offset,
      cellWidth,
    ]
  );

  // Sync the scroll position of the main cell grid and the static headers. This
  // was inspired by the way that Google Calendar's UI is currently setup.
  // @see {@link https://mzl.la/35OIC9y}
  const headerRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);
  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setCellsMeasureIsCorrect(true);
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

  const eventGroups = useMemo(() => placeMeetingsInDay(meetings, start.getDay()), [meetings, start]);
  const props = useSpring({ config, marginRight: filtersOpen ? width : 0 });

  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const { updateEl, removeEl } = useClickContext();
  const cellsClickRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl('calendar-cells');
      return updateEl('calendar-cells', node);
    },
    [updateEl, removeEl]
  );
  
  const { lang: locale } = useTranslation();
  const today =
    now.getFullYear() === start.getFullYear() &&
    now.getMonth() === start.getMonth() &&
    now.getDate() === start.getDate();

  // Show current time indicator if today is current date.
  const { y: top } = getPosition(now);
  
  return (
    <animated.div className={styles.wrapper} style={props}>
      <div className={styles.headerWrapper}>
        <div ref={headerRef} className={styles.headerContent}>
          <div className={styles.headers}>
            <div className={styles.titleWrapper}>
              <h2 className={cn({ [styles.today]: today })}>
                <div className={styles.weekday}>
                  {start.toLocaleString(locale, { weekday: 'short' })}
                </div>
                <div className={styles.date}>{start.getDate()}</div>
              </h2>
            </div>
          </div>
          <div className={styles.headerCells}>
            <div className={styles.headerCell} />
          </div>
        </div>
        <div className={styles.scroller} />
      </div>
      <div className={styles.gridWrapper}>
        <div className={styles.grid}>
          <div className={styles.timesWrapper} ref={timesRef}>
            <div className={styles.times}>
              <Times />
              <div className={styles.spacer} />
            </div>
          </div>
          <div
            className={styles.rowsWrapper}
            onScroll={onScroll}
            ref={mergeRefs([rowsMeasureRef, rowsRef])}
          >
            {searching && (
              <div className={styles.loader}>
                <LoadingDots size={4} />
              </div>
            )}
            <div className={styles.rows}>
              <div className={styles.lines}>
                <Lines />
              </div>
              <div className={styles.space} />
              <div
                className={styles.cells}
                onClick={onClick}
                ref={mergeRefs([cellsMeasureRef, cellsClickRef])}
              >
                {rnd && (
                  <MeetingRnd
                    now={now}
                    width={cellWidth}
                    eventData={eventData}
                    eventTarget={eventTarget}
                  />
                )}
                <div className={styles.cell} ref={cellMeasureRef}>
                  {today && (
                    <div style={{ top }} className={styles.indicator}>
                      <div className={styles.dot} />
                      <div className={styles.line} />
                    </div>
                  )}
                  {eventGroups
                    .map((cols: Meeting[][]) =>
                      cols.map((col: Meeting[], colIdx) =>
                        col.map((e: Meeting) => (
                          <MeetingItem
                            now={now}
                            meeting={e}
                            setEventTarget={setEventTarget}
                            setEventData={setEventData}
                            widthPercent={
                              expand(e, colIdx, cols) / cols.length
                            }
                            leftPercent={colIdx / cols.length}
                            key={e.id}
                          />
                        ))
                      )
                    )
                    .flat(2)}
                  <style jsx>{`
                    div {
                      max-width: calc(100% - 10px) !important;
                    }
                  `}</style>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </animated.div>
  );
}

export default memo(DailyDisplay);
