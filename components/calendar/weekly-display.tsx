import {
  MouseEvent,
  Ref,
  UIEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { animated, useSpring } from 'react-spring';
import mergeRefs from 'react-merge-refs';
import { nanoid } from 'nanoid';

import LoadingDots from 'components/loading-dots';

import { Callback } from 'lib/model/callback';
import { Meeting } from 'lib/model/meeting';
import { Position } from 'lib/model/position';
import { getDateWithDay } from 'lib/utils/time';
import { useClickContext } from 'lib/hooks/click-outside';

import { Headers, Lines, Times, Weekdays } from './components';
import { MouseEventHackData, MouseEventHackTarget } from './hack-types';
import { config, width } from './spring-animation';
import { expand, placeMeetings } from './place-meetings';
import { getMeeting, getPosition } from './utils';
import MeetingItem from './meetings/item';
import MeetingRnd from './meetings/rnd';
import styles from './weekly-display.module.scss';
import { useCalendar } from './context';

export interface WeeklyDisplayProps {
  searching: boolean;
  meetings: Meeting[];
  filtersOpen: boolean;
  editing: Meeting;
  setEditing: Callback<Meeting>;
  onEditStop: () => void;
  viewing?: Meeting;
  setViewing: Callback<Meeting | undefined>;
  draggingId?: string;
  setDraggingId: Callback<string | undefined>;
  rowsMeasureRef: Ref<HTMLDivElement>;
  cellsMeasureRef: Ref<HTMLDivElement>;
  cellMeasureRef: Ref<HTMLDivElement>;
  cellWidth: number;
  offset: Position;
  setCellsMeasureIsCorrect: Callback<boolean>;
}

function WeeklyDisplay({
  searching,
  meetings,
  filtersOpen,
  editing,
  setEditing,
  onEditStop,
  viewing,
  setViewing,
  draggingId,
  setDraggingId,
  rowsMeasureRef,
  cellsMeasureRef,
  cellMeasureRef,
  cellWidth,
  offset,
  setCellsMeasureIsCorrect,
}: WeeklyDisplayProps): JSX.Element {
  const [eventTarget, setEventTarget] = useState<MouseEventHackTarget>();
  const [eventData, setEventData] = useState<MouseEventHackData>();
  const [editRndVisible, setEditRndVisible] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());

  const headerRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);

  const { updateEl, removeEl } = useClickContext();
  const cellsClickRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl('calendar-cells');
      return updateEl('calendar-cells', node);
    },
    [updateEl, removeEl]
  );

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
  const { startingDate } = useCalendar();
  const onClick = useCallback(
    (event: MouseEvent) => {
      if (draggingId) return;
      const pos = { x: event.clientX - offset.x, y: event.clientY - offset.y };
      const meeting = new Meeting({ id: `temp-${nanoid()}` });
      setViewing(getMeeting(48, pos, meeting, cellWidth, startingDate));
    },
    [setViewing, draggingId, startingDate, offset, cellWidth]
  );

  // Sync the scroll position of the main cell grid and the static headers. This
  // was inspired by the way that Google Calendar's UI is currently setup.
  // @see {@link https://mzl.la/35OIC9y}
  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
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
    },
    [setCellsMeasureIsCorrect]
  );

  const eventGroups = useMemo(() => placeMeetings(meetings), [meetings]);
  const props = useSpring({ config, marginRight: filtersOpen ? width : 0 });

  return (
    <animated.div className={styles.wrapper} style={props}>
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
                {viewing?.id.startsWith('temp') && (
                  <MeetingRnd
                    now={now}
                    width={cellWidth}
                    meeting={viewing}
                    setMeeting={setViewing}
                    setDraggingId={setDraggingId}
                  />
                )}
                {editing && editRndVisible && (
                  <MeetingRnd
                    now={now}
                    width={cellWidth}
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
                    <div key={day} className={styles.cell} ref={cellMeasureRef}>
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
    </animated.div>
  );
}

export default memo(WeeklyDisplay);
