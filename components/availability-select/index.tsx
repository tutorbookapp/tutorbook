import {
  FocusEvent,
  MouseEvent,
  UIEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldHTMLProps, TextFieldProps } from '@rmwc/textfield';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import { dequal } from 'dequal/lite';
import { nanoid } from 'nanoid';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import { Availability, TCallback, Timeslot } from 'lib/model';
import { getDateWithTime, getNextDateWithDay } from 'lib/utils/time';
import { useContinuous } from 'lib/hooks';

import TimeslotRnd from './timeslot-rnd';
import { getTimeslot } from './utils';
import styles from './availability-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  value: Availability;
  onChange: TCallback<Availability>;
  renderToPortal?: boolean;
  focused?: boolean;
  onFocused?: () => void;
  onBlurred?: () => void;
  className?: string;
}

export type AvailabilitySelectProps = Omit<
  TextFieldHTMLProps,
  keyof Props | OverridenProps
> &
  Omit<TextFieldProps, keyof Props | OverridenProps> &
  Props;

/**
 * The `AvailabilitySelect` emulates the drag-and-resize interface of Google
 * Calendar's event creation UI but on a much smaller scale. We use `react-rnd`
 * within an RMWC `MenuSurface` to craft our UX.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/50}
 */
export default function AvailabilitySelect({
  value,
  onChange,
  renderToPortal,
  focused,
  onFocused,
  onBlurred,
  className,
  ...textFieldProps
}: AvailabilitySelectProps): JSX.Element {
  const { lang: locale } = useTranslation();

  const headerRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);

  const [cellsRef, { x, y }] = useMeasure({ polyfill, scroll: true });
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
  // before toggling which ensures the user hasn't re-opened the menu.
  // @see {@link https:bit.ly/2x9eM27}
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  useLayoutEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  useEffect(() => {
    // Scroll to 8:30am by default (assumes 48px per hour).
    if (rowsRef.current) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, []);

  // TODO: Fix the `useContinuous` hook to skip this callback when the component
  // is initially mounted (e.g. leads to invalid analytics tracking).
  const updateRemote = useCallback(
    async (updated: Availability) => {
      onChange(updated);
    },
    [onChange]
  );
  const { data, setData } = useContinuous(value, updateRemote);

  const updateTimeslot = useCallback(
    (origIdx: number, updated?: Timeslot) => {
      setData((prev) => {
        if (!updated)
          return new Availability(
            ...prev.slice(0, origIdx),
            ...prev.slice(origIdx + 1)
          );
        let avail: Availability;
        if (origIdx < 0) {
          avail = new Availability(...prev, updated).sort();
        } else {
          avail = new Availability(
            ...prev.slice(0, origIdx),
            updated,
            ...prev.slice(origIdx + 1)
          ).sort();
        }
        const idx = avail.findIndex((t) => t.id === updated.id);
        const last = avail[idx - 1];
        if (last && last.from.getDay() === updated.from.getDay()) {
          // Contained within another timeslot.
          if (last.to.valueOf() >= updated.to.valueOf())
            return new Availability(
              ...avail.slice(0, idx),
              ...avail.slice(idx + 1)
            );
          // Overlapping with end of another timeslot.
          if (last.to.valueOf() >= updated.from.valueOf())
            return new Availability(
              ...avail.slice(0, idx - 1),
              new Timeslot({ ...last, to: updated.to }),
              ...avail.slice(idx + 1)
            );
        }
        const next = avail[idx + 1];
        if (next && next.from.getDay() === updated.from.getDay()) {
          // Overlapping with start of another timeslot.
          if (next.from.valueOf() <= updated.to.valueOf())
            return new Availability(
              ...avail.slice(0, idx),
              new Timeslot({ ...next, from: updated.from }),
              ...avail.slice(idx + 2)
            );
        }
        return avail;
      });
    },
    [setData]
  );

  // Ensure that all of the timeslots have valid React keys.
  useEffect(() => {
    setData((prev) => {
      const ids = prev.map((t) => new Timeslot({ ...t, id: t.id || nanoid() }));
      if (!dequal(ids, prev)) return new Availability(...ids);
      return prev;
    });
  }, [value, setData]);

  // Create a new `TimeslotRND` closest to the user's click position. Assumes
  // each column is 82px wide and every hour is 48px tall (i.e. 12px = 15min).
  const onClick = useCallback(
    (event: MouseEvent) => {
      const position = { x: event.clientX - x, y: event.clientY - y };
      updateTimeslot(-1, getTimeslot(48, position, nanoid()));
    },
    [x, y, updateTimeslot]
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
            <h2 className={styles.titleContent}>
              <div className={styles.day}>
                {getNextDateWithDay(weekday).toLocaleString(locale, {
                  weekday: 'long',
                })}
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
        .map(() => <div key={nanoid()} className={styles.cell} />),
    []
  );

  return (
    <MenuSurfaceAnchor className={className}>
      <MenuSurface
        tabIndex={-1}
        open={menuOpen}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          if (inputRef.current) inputRef.current.focus();
        }}
        anchorCorner='bottomStart'
        className={styles.menuSurface}
        renderToPortal={renderToPortal ? '#portal' : false}
        data-cy='availability-select-surface'
      >
        <div ref={headerRef} className={styles.headerWrapper}>
          <div className={styles.headers}>
            <div className={styles.space} />
            {weekdayCells}
            <div className={styles.scroller} />
          </div>
          <div className={styles.headerCells}>
            <div className={styles.space} />
            {headerCells}
            <div className={styles.scroller} />
          </div>
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
                  {data.map((timeslot: Timeslot, origIdx: number) => (
                    <TimeslotRnd
                      key={timeslot.id || nanoid()}
                      value={timeslot}
                      onChange={(updated) => updateTimeslot(origIdx, updated)}
                    />
                  ))}
                  {dayCells}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MenuSurface>
      <TextField
        {...textFieldProps}
        readOnly
        textarea={false}
        inputRef={inputRef}
        value={data
          .map((t) => {
            const showSecondDate =
              t.from.getDate() !== t.to.getDate() ||
              t.from.getMonth() !== t.to.getMonth() ||
              t.from.getFullYear() !== t.to.getFullYear();
            return `${t.from.toLocaleString(locale, {
              weekday: 'long',
              hour: 'numeric',
              minute: 'numeric',
            })} - ${t.to.toLocaleString(locale, {
              weekday: showSecondDate ? 'long' : undefined,
              hour: 'numeric',
              minute: 'numeric',
            })}`;
          })
          .join(', ')}
        className={styles.textField}
        onFocus={() => {
          if (onFocused) onFocused();
          if (timeoutId.current) {
            clearTimeout(timeoutId.current);
            timeoutId.current = undefined;
          }
          setMenuOpen(true);
        }}
        onBlur={() => {
          if (onBlurred) onBlurred();
          timeoutId.current = setTimeout(() => setMenuOpen(false), 0);
        }}
      />
    </MenuSurfaceAnchor>
  );
}
