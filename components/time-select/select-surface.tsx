import {
  FormEvent,
  RefObject,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { animated, useSpring } from 'react-spring';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';
import cn from 'classnames';
import { dequal } from 'dequal/lite';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import ChevronLeftIcon from 'components/icons/chevron-left';
import ChevronRightIcon from 'components/icons/chevron-right';

import { Availability } from 'lib/model/availability';
import {
  getDate,
  getDaysInMonth,
  getMonthsApart,
  getMonthsTimeslots,
  getWeekdayOfFirst,
  sameDate,
} from 'lib/utils/time';
import { TCallback } from 'lib/model/callback';
import { Timeslot } from 'lib/model/timeslot';

import styles from './time-select.module.scss';

/**
 * Checks if a timeslot occurs on a given date.
 * @param timeslot - The timeslot to check.
 * @param date - The date which we expect the timeslot to be on.
 * @return Whether or not the timeslot occurs on the given date.
 */
function timeslotOnDate(timeslot: Timeslot, date: Date): boolean {
  return sameDate(timeslot.from, date) && sameDate(timeslot.to, date);
}

/**
 * Returns the timeslots that are available on a given date.
 * @param date - The JavaScript `Date` object from which we determine the
 * date (e.g. 1st or 31st), month, and year.
 * @return An array of timeslots of the requested duration that are available
 * on the given date.
 */
function onDate(availability: Availability, date: Date): Availability {
  return availability.filter((t) => timeslotOnDate(t, date));
}

/**
 * Returns whether or not there is any availability on a given date.
 * @param date - The JavaScript `Date` object from which we determine the
 * date (e.g. 1st or 31st), month, and year.
 * @return Whether or not there is any available on the given date.
 */
function hasDate(availability: Availability, date: Date): boolean {
  return availability.some((t) => timeslotOnDate(t, date));
}

export interface SelectSurfaceProps {
  uid?: string;
  onChange: TCallback<Timeslot>;
  inputRef: RefObject<HTMLInputElement>;
}

// This is split from the main `TimeSelect` component to prevent expensive
// re-renders (e.g. the `value` can change without re-rendering all of this).
function SelectSurface({
  uid,
  onChange,
  inputRef,
}: SelectSurfaceProps): JSX.Element {
  const [ref, { width }] = useMeasure({ polyfill });
  const [selectOpen, setSelectOpen] = useState<boolean>(false);
  const props = useSpring({
    width: selectOpen ? width : 0,
    tension: 200,
  });

  const { lang: locale } = useTranslation();

  const [date, setDate] = useState<number>(new Date().getDate());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (month < 0 || month > 11) {
      setMonth(month < 0 ? (month % 12) + 12 : month % 12);
      setYear((prev) => prev + Math.floor(month / 12));
    }
  }, [month]);

  const viewPrevMonth = useCallback((evt: FormEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    setMonth((prev) => prev - 1);
  }, []);
  const viewNextMonth = useCallback((evt: FormEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    setMonth((prev) => prev + 1);
  }, []);
  const selected = useMemo(() => new Date(year, month, date), [
    year,
    month,
    date,
  ]);

  const { data } = useSWR<Availability>(
    uid ? `/api/users/${uid}/availability?month=${month}&year=${year}` : null
  );
  const full = useMemo(() => {
    const all: Availability = [];
    const days = Array(7).fill(null);
    days.forEach((_, day) => {
      all.push(Timeslot.parse({ from: getDate(day, 0), to: getDate(day, 24) }));
    });
    return getMonthsTimeslots(all, month, year);
  }, [month, year]);
  const availability = useMemo(
    () => Availability.parse((data || full).filter((t) => t.from > now)),
    [data, now, full]
  );
  const availabilityOnSelected = useMemo(() => onDate(availability, selected), [
    selected,
    availability,
  ]);
  const dateAvailability = useMemo(
    () =>
      Array(getDaysInMonth(month))
        .fill(null)
        .map((_, idx) => hasDate(availability, new Date(year, month, idx + 1))),
    [year, month, availability]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.dateSelect}>
        <div className={styles.pagination}>
          <h6 data-cy='selected-month' className={styles.month}>
            {selected.toLocaleString(locale, {
              month: 'long',
              year: 'numeric',
            })}
          </h6>
          <div className={styles.navigation}>
            <IconButton
              icon={<ChevronLeftIcon />}
              onClick={viewPrevMonth}
              disabled={getMonthsApart(selected) <= 0}
              data-cy='prev-month-button'
            />
            <IconButton
              icon={<ChevronRightIcon />}
              onClick={viewNextMonth}
              disabled={getMonthsApart(selected) >= 1}
              data-cy='next-month-button'
            />
          </div>
        </div>
        <div className={styles.weekdays}>
          {Array(7)
            .fill(null)
            .map((_, idx) => (
              <div className={styles.weekday} key={`day-${idx}`}>
                {getDate(idx, 0).toLocaleString(locale, {
                  weekday: 'narrow',
                })}
              </div>
            ))}
        </div>
        <div className={styles.dates}>
          {Array(getDaysInMonth(month))
            .fill(null)
            .map((_, idx) => (
              <IconButton
                type='button'
                data-cy='day-button'
                icon={idx + 1}
                key={`date-${idx}`}
                disabled={!dateAvailability[idx]}
                className={cn(styles.date, {
                  [styles.active]: idx + 1 === date,
                })}
                style={{
                  gridColumn:
                    idx === 0 ? getWeekdayOfFirst(month, year) + 1 : undefined,
                }}
                onClick={(evt: FormEvent<HTMLButtonElement>) => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  setDate(idx + 1);
                  setSelectOpen(true);
                }}
                aria-selected={idx + 1 === date}
              />
            ))}
        </div>
      </div>
      <animated.div style={props} className={styles.timeslotSelectWrapper}>
        <div ref={ref} className={styles.timeslotSelect}>
          <h6 data-cy='selected-day' className={styles.day}>
            {selected.toLocaleString(locale, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h6>
          <div className={styles.times}>
            {availabilityOnSelected.map((timeslot) => (
              <Button
                outlined
                data-cy='time-button'
                className={styles.time}
                key={timeslot.from.toJSON()}
                label={timeslot.from.toLocaleString(locale, {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                })}
                onClick={(evt: FormEvent<HTMLButtonElement>) => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  onChange(timeslot);
                  inputRef.current?.blur();
                }}
              />
            ))}
          </div>
        </div>
      </animated.div>
    </div>
  );
}

export default memo(
  SelectSurface,
  (prevProps: SelectSurfaceProps, nextProps: SelectSurfaceProps) =>
    dequal(prevProps, nextProps)
);
