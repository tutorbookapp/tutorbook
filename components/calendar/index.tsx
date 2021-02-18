import {
  MouseEvent,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Snackbar } from '@rmwc/snackbar';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import mergeRefs from 'react-merge-refs';
import { nanoid } from 'nanoid';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import LoadingDots from 'components/loading-dots';

import { Meeting, MeetingJSON, Timeslot } from 'lib/model';
import { useClickOutside, useSingle } from 'lib/hooks';
import { ClickContext } from 'lib/hooks/click-outside';
import { getDateWithDay } from 'lib/utils/time';

import { CreateDialog, DialogSurface, EditDialog } from './dialogs';
import { Headers, Lines, Times, Weekdays } from './components';
import { MouseEventHackData, MouseEventHackTarget } from './hack-types';
import { getMeeting, getPosition } from './utils';
import MeetingItem from './meetings/item';
import MeetingRnd from './meetings/rnd';
import styles from './calendar.module.scss';
import { useCalendar } from './context';

export interface CalendarBodyProps {
  searching: boolean;
  meetings: Meeting[];
}

const COLS = Array(7).fill(null);
const initialEditData = new Meeting();

// Check if two events collide (i.e. overlap).
function collides(a: Timeslot, b: Timeslot): boolean {
  return a.to > b.from && a.from < b.to;
}

// Expands events at the far right to use up any remaining
// space. Returns the number of columns the event can
// expand into, without colliding with other events.
function expand(e: Meeting, colIdx: number, cols: Meeting[][]): number {
  let colSpan = 1;
  cols.slice(colIdx + 1).some((col) => {
    if (col.some((evt) => collides(e.time, evt.time))) return true;
    colSpan += 1;
    return false;
  });
  return colSpan;
}

export default function CalendarBody({
  searching,
  meetings,
}: CalendarBodyProps): JSX.Element {
  const [eventTarget, setEventTarget] = useState<MouseEventHackTarget>();
  const [eventData, setEventData] = useState<MouseEventHackData>();
  const [editRndVisible, setEditRndVisible] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string>();
  const [viewing, setViewing] = useState<Meeting>();
  const [now, setNow] = useState<Date>(new Date());

  const updateMeetingRemote = useCallback(async (updated: Meeting) => {
    const url = `/api/meetings/${updated.id}`;
    const { data } = await axios.put<MeetingJSON>(url, updated.toJSON());
    return Meeting.fromJSON(data);
  }, []);

  const { mutateMeeting, startingDate } = useCalendar();
  const { updateEl, removeEl } = useClickOutside(
    () => setDialogOpen(false),
    dialogOpen
  );
  const {
    data: editing,
    setData: setEditing,
    onSubmit: onEditStop,
    loading: editLoading,
    checked: editChecked,
    error: editError,
  } = useSingle<Meeting>(initialEditData, updateMeetingRemote, mutateMeeting);

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

  const eventGroups = useMemo(
    () =>
      // Place concurrent meetings side-by-side (like GCal).
      // @see {@link https://share.clickup.com/t/h/hpxh7u/WQO1OW4DQN0SIZD}
      // @see {@link https://stackoverflow.com/a/11323909/10023158}
      // @see {@link https://jsbin.com/detefuveta/edit}

      // Each day contains the groups that are on that day.
      COLS.map((_, day) => {
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
            if (lastEventEnding && e.time.from >= lastEventEnding) {
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
        return [...groups, columns];
      }),
    [meetings]
  );

  return (
    <ClickContext.Provider value={{ updateEl, removeEl }}>
      {editChecked && <Snackbar message='Updated meeting.' leading open />}
      {editError && (
        <Snackbar
          message='Could not update meeting. Try again later.'
          leading
          open
        />
      )}
      {editLoading && !editChecked && !editError && (
        <Snackbar message='Updating meeting...' timeout={-1} leading open />
      )}
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
            <EditDialog meeting={viewing} dialogOpen={dialogOpen} />
          )}
          {viewing.id.startsWith('temp') && (
            <CreateDialog viewing={viewing} setViewing={setViewing} />
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
                    <MeetingRnd
                      now={now}
                      width={width}
                      meeting={viewing}
                      setMeeting={setViewing}
                      setDraggingId={setDraggingId}
                    />
                  )}
                  {editing && editRndVisible && (
                    <MeetingRnd
                      now={now}
                      width={width}
                      meeting={editing}
                      setMeeting={setEditing}
                      setDraggingId={setDraggingId}
                      onEditStop={() => {
                        void onEditStop();
                        setEditRndVisible(false);
                      }}
                      eventData={eventData}
                      eventTarget={eventTarget}
                    />
                  )}
                  {eventGroups.map((groups: Meeting[][][], day) => {
                    // Show current time indicator if today is current date.
                    const date = getDateWithDay(day, startingDate);
                    const today =
                      now.getFullYear() === date.getFullYear() &&
                      now.getMonth() === date.getMonth() &&
                      now.getDate() === date.getDate();
                    const { y: top } = getPosition(now);

                    return (
                      <div key={day} className={styles.cell} ref={cellRef}>
                        {today && (
                          <div style={{ top }} className={styles.indicator}>
                            <div className={styles.dot} />
                            <div className={styles.line} />
                          </div>
                        )}
                        {groups
                          .map((cols: Meeting[][]) =>
                            cols.map((col: Meeting[], colIdx) =>
                              col.map((e: Meeting) => (
                                <MeetingItem
                                  now={now}
                                  meeting={e}
                                  viewing={viewing}
                                  setViewing={setViewing}
                                  editing={editing}
                                  setEditing={setEditing}
                                  editRndVisible={editRndVisible}
                                  setEditRndVisible={setEditRndVisible}
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
