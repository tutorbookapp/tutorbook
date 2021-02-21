import cn from 'classnames';
import { memo } from 'react';
import { nanoid } from 'nanoid';
import useTranslation from 'next-translate/useTranslation';

import { getDateWithDay, getDateWithTime } from 'lib/utils/time';

import styles from './weekly-display.module.scss';
import { useCalendar } from './context';

const COLS = Array(7).fill(null);
const ROWS = Array(24).fill(null);

export const Headers = memo(
  (): JSX.Element => (
    <>
      {COLS.map(() => (
        <div key={nanoid()} className={styles.headerCell} />
      ))}
    </>
  )
);

export const Lines = memo(
  (): JSX.Element => (
    <>
      {ROWS.map(() => (
        <div key={nanoid()} className={styles.line} />
      ))}
    </>
  )
);

export const Times = memo(
  (): JSX.Element => {
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
);

export interface WeekdaysProps {
  now: Date;
}

export const Weekdays = memo(
  ({ now }: WeekdaysProps): JSX.Element => {
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
);
