import { RefObject } from 'react';
import cn from 'classnames';
import { nanoid } from 'nanoid';
import useTranslation from 'next-translate/useTranslation';

import { getDateWithDay, getDateWithTime } from 'lib/utils/time';

import { getPosition } from './utils';
import styles from './calendar.module.scss';
import { useCalendar } from './context';

const COLS = Array(7).fill(null);
const ROWS = Array(24).fill(null);

export interface CellsProps {
  now: Date;
  cellRef: RefObject<HTMLDivElement>;
}

export function Cells({ now, cellRef }: CellsProps): JSX.Element {
  const { startingDate } = useCalendar();

  return (
    <>
      {COLS.map((_, day) => {
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
      })}
    </>
  );
}

export function Headers(): JSX.Element {
  return (
    <>
      {COLS.map(() => (
        <div key={nanoid()} className={styles.headerCell} />
      ))}
    </>
  );
}

export function Lines(): JSX.Element {
  return (
    <>
      {ROWS.map(() => (
        <div key={nanoid()} className={styles.line} />
      ))}
    </>
  );
}

export function Times(): JSX.Element {
  const { lang: locale } = useTranslation();

  return (
    <>
      {ROWS.map((_, hour) => (
        <div key={nanoid()} className={styles.timeWrapper}>
          <span className={styles.timeLabel}>
            {getDateWithTime(hour).toLocaleString(locale, {
              hour: '2-digit',
            })}
          </span>
        </div>
      ))}
    </>
  );
}

export interface WeekdaysProps {
  now: Date;
}

export function Weekdays({ now }: WeekdaysProps): JSX.Element {
  const { lang: locale } = useTranslation();
  const { startingDate } = useCalendar();

  return (
    <>
      {COLS.map((_, day) => {
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
      })}
    </>
  );
}
