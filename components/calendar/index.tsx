import {
  MouseEvent,
  UIEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { dequal } from 'dequal/lite';
import mergeRefs from 'react-merge-refs';
import { nanoid } from 'nanoid';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import LoadingDots from 'components/loading-dots';

import { Meeting, Timeslot } from 'lib/model';
import { ClickContext } from 'lib/hooks/click-outside';
import { getDateWithDay } from 'lib/utils/time';
import { useClickOutside } from 'lib/hooks';

import {
  DialogSurface,
  ExistingMeetingDialog,
  NewMeetingDialog,
} from './dialogs';
import { ExistingMeetingRnd, NewMeetingRnd } from './rnds';
import { Headers, Lines, Times, Weekdays } from './components';
import { getMeeting, getPosition } from './utils';
import MeetingDisplay from './meeting-display';
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
  const [now, setNow] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string>();
  const [viewing, setViewing] = useState<Meeting>();

  const { startingDate } = useCalendar();
  const { updateEl, removeEl } = useClickOutside(
    () => setDialogOpen(false),
    dialogOpen
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);

  const cellsClickRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl('calendar-cells');
      return updateEl('calendar-cells', node);
    },
    [updateEl, removeEl]
  );

  const [cellsMeasureRef, { x, y }] = useMeasure({ polyfill, scroll: true });
  const [cellRef, { width }] = useMeasure({ polyfill });

  useEffect(() => {
    setViewing((prev) => {
      if (prev?.id.startsWith('temp')) return prev;
      const idx = meetings.findIndex((m) => m.id === prev?.id);
      if (idx < 0) {
        setDialogOpen(false);
        return prev;
      }
      if (dequal(meetings[idx], prev)) return prev;
      return meetings[idx];
    });
  }, [meetings]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Scroll to 8:30am by default (assumes 48px per hour).
    if (rowsRef.current) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, []);

  // Create a new `TimeslotRND` closest to the user's click position. Assumes
  // each column is 82px wide and every hour is 48px tall (i.e. 12px = 15min).
  const onClick = useCallback(
    (event: MouseEvent) => {
      if (draggingId) return;
      const position = { x: event.clientX - x, y: event.clientY - y };
      const meeting = new Meeting({ id: `temp-${nanoid()}` });
      setViewing(getMeeting(48, position, meeting, width, startingDate));
    },
    [draggingId, startingDate, x, y, width]
  );

  // Don't unmount the dialog surface if the user is draggingId (in that case, we
  // only temporarily hide the dialog until the user is finished draggingId).
  const onClosed = useCallback(() => {
    if (!draggingId) setViewing(undefined);
  }, [draggingId]);

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

  return (
    <ClickContext.Provider value={{ updateEl, removeEl }}>
      {viewing && (
        <DialogSurface
          width={width}
          offset={{ x, y }}
          viewing={viewing}
          dialogOpen={dialogOpen && !draggingId}
          setDialogOpen={setDialogOpen}
          onClosed={onClosed}
        >
          {!viewing.id.startsWith('temp') && (
            <ExistingMeetingDialog meeting={viewing} />
          )}
          {viewing.id.startsWith('temp') && (
            <NewMeetingDialog viewing={viewing} setViewing={setViewing} />
          )}
        </DialogSurface>
      )}
      <div className={styles.calendar}>
        <div className={styles.headerWrapper}>
          <div ref={headerRef} className={styles.headerContent}>
            <div className={styles.headers}>
              <Weekdays now={now} />
            </div>
            <div className={styles.headerCells}>
              <Headers />
            </div>
          </div>
          <div className={styles.scroller} />
        </div>
        <div className={styles.gridWrapper}>
          <div className={styles.grid}>
            <div className={styles.timesWrapper} ref={timesRef}>
              <div className={styles.times}>
                <Times />
              </div>
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
                <div className={styles.lines}>
                  <Lines />
                </div>
                <div className={styles.space} />
                <div
                  className={styles.cells}
                  onClick={onClick}
                  ref={mergeRefs([cellsMeasureRef, cellsClickRef])}
                >
                  {viewing?.id.startsWith('temp') && (
                    <NewMeetingRnd
                      now={now}
                      width={width}
                      viewing={viewing}
                      setViewing={setViewing}
                      draggingId={draggingId}
                      setDraggingId={setDraggingId}
                    />
                  )}
                  {/*
                   *{!searching && meetings.map((meeting: Meeting) => (
                   *  <ExistingMeetingRnd
                   *    now={now}
                   *    width={width}
                   *    viewing={viewing}
                   *    setViewing={setViewing}
                   *    draggingId={draggingId}
                   *    setDraggingId={setDraggingId}
                   *    meeting={meeting}
                   *    key={meeting.id}
                   *  />
                   *))}
                   */}
                  {Array(7)
                    .fill(null)
                    .map((_, day) => {
                      // Place concurrent meetings side-by-side (like GCal).
                      // @see {@link https://share.clickup.com/t/h/hpxh7u/WQO1OW4DQN0SIZD}
                      // @see {@link https://stackoverflow.com/a/11323909/10023158}
                      // @see {@link https://jsbin.com/detefuveta/edit}

                      // Check if two events collide (i.e. overlap).
                      function collides(a: Timeslot, b: Timeslot): boolean {
                        return a.to > b.from && a.from < b.to;
                      }

                      // Expands events at the far right to use up any remaining
                      // space. Returns the number of columns the event can
                      // expand into, without colliding with other events.
                      function expand(
                        e: Meeting,
                        colIdx: number,
                        cols: Meeting[][]
                      ): number {
                        let colSpan = 1;
                        cols.slice(colIdx + 1).some((col) =>
                          col.some((evt: Meeting) => {
                            if (collides(e.time, evt.time)) return true;
                            colSpan += 1;
                            return false;
                          })
                        );
                        return colSpan;
                      }

                      // Each group contains columns of events that overlap.
                      const groups: Meeting[][][] = [];
                      // Each column contains events that do not overlap.
                      let columns: Meeting[][] = [];
                      let lastEventEnding: Date | undefined;
                      // Place each event into a column within an event group.
                      meetings
                        .filter((m) => m.time.from.getDay() === day)
                        .sort(({ time: e1 }, { time: e2 }) => {
                          if (e1.from < e2.from) return -1;
                          if (e1.from > e2.from) return 1;
                          if (e1.to < e2.to) return -1;
                          if (e1.to > e2.to) return 1;
                          return 0;
                        })
                        .forEach((e) => {
                          // Check if a new event group needs to be started.
                          if (
                            lastEventEnding &&
                            e.time.from >= lastEventEnding
                          ) {
                            // The event is later than any of the events in the
                            // current group. There is no overlap. Output the
                            // current event group and start a new one.
                            groups.push(columns);
                            columns = [];
                            lastEventEnding = undefined;
                          }

                          // Try to place the event inside an existing column.
                          let placed = false;
                          columns.some((col) => {
                            if (!collides(col[col.length - 1].time, e.time)) {
                              col.push(e);
                              placed = true;
                            }
                            return placed;
                          });

                          // It was not possible to place the event (it overlaps
                          // with events in each existing column). Add a new column
                          // to the current event group with the event in it.
                          if (!placed) columns.push([e]);

                          // Remember the last event end time of the current group.
                          if (!lastEventEnding || e.time.to > lastEventEnding)
                            lastEventEnding = e.time.to;
                        });
                      groups.push(columns);

                      // Show current time indicator if today is current date.
                      const date = getDateWithDay(day, startingDate);
                      const today =
                        now.getFullYear() === date.getFullYear() &&
                        now.getMonth() === date.getMonth() &&
                        now.getDate() === date.getDate();
                      const { y: top } = getPosition(now);

                      return (
                        <div
                          key={nanoid()}
                          className={styles.cell}
                          ref={cellRef}
                        >
                          {today && (
                            <div style={{ top }} className={styles.indicator}>
                              <div className={styles.dot} />
                              <div className={styles.line} />
                            </div>
                          )}
                          {groups.map((cols: Meeting[][]) =>
                            cols.map((col: Meeting[], colIdx) =>
                              col.map((e: Meeting) => (
                                <MeetingDisplay
                                  now={now}
                                  viewing={viewing}
                                  setViewing={setViewing}
                                  meeting={e}
                                  widthPercent={
                                    expand(e, colIdx, cols) / cols.length
                                  }
                                  leftPercent={colIdx / cols.length}
                                />
                              ))
                            )
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClickContext.Provider>
  );
}
