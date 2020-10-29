import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TextField, TextFieldHTMLProps, TextFieldProps } from '@rmwc/textfield';
import { animated, useSpring } from 'react-spring';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';
import cn from 'classnames';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import {
  Availability,
  AvailabilityJSON,
  Callback,
  DayAlias,
  Timeslot,
} from 'lib/model';
import { getDate, getDaysInMonth, getWeekdayOfFirst } from 'lib/utils/time';

import styles from './time-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  uid: string;
  value?: Timeslot;
  onChange: Callback<Timeslot | undefined>;
  renderToPortal?: boolean;
  focused?: boolean;
  onFocused?: () => any;
  onBlurred?: () => any;
  className?: string;
}

export type TimeSelectProps = Omit<
  TextFieldHTMLProps,
  keyof Props | OverridenProps
> &
  Omit<TextFieldProps, keyof Props | OverridenProps> &
  Props;

export default function TimeSelect({
  uid,
  value,
  onChange,
  renderToPortal,
  focused,
  onFocused,
  onBlurred,
  className,
  ...textFieldProps
}: TimeSelectProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useLayoutEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  // We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
  // before toggling which ensures the user hasn't re-opened the menu.
  // @see {@link https:bit.ly/2x9eM27}
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  const openMenu = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = undefined;
    }
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    timeoutId.current = setTimeout(() => setMenuOpen(false), 0);
  }, []);

  const [ref, { width }] = useMeasure();
  const [timeslotSelectOpen, setTimeslotSelectOpen] = useState<boolean>(
    !!value
  );
  const props = useSpring({
    width: timeslotSelectOpen ? width : 0,
    tension: 200,
  });

  const { lang: locale } = useTranslation();

  const [date, setDate] = useState<number>(
    (value?.from || new Date()).getDate()
  );
  const [year, setYear] = useState<number>(
    (value?.from || new Date()).getFullYear()
  );
  const [month, setMonth] = useState<number>(
    (value?.from || new Date()).getMonth()
  );

  const viewPrevMonth = useCallback(() => setMonth((prev) => prev - 1), []);
  const viewNextMonth = useCallback(() => setMonth((prev) => prev + 1), []);
  const selected = useMemo(() => new Date(year, month, date), [
    year,
    month,
    date,
  ]);

  useEffect(() => {
    if (month < 0 || month > 11) {
      setMonth(month < 0 ? (month % 12) + 12 : month % 12);
      setYear((prev) => prev + Math.floor(month / 12));
    }
  }, [month]);

  const { data } = useSWR<AvailabilityJSON>(
    `/api/users/${uid}/availability?month=${month}&year=${year}`
  );
  const availability = useMemo(
    () => (data ? Availability.fromJSON(data) : new Availability()),
    [data]
  );
  const availabilityOnSelected = useMemo(() => availability.onDate(selected), [
    selected,
    availability,
  ]);
  const dateAvailability = useMemo(
    () =>
      Array(getDaysInMonth(month))
        .fill(null)
        .map((_, idx) => availability.hasDate(new Date(year, month, idx + 1))),
    [year, month, availability]
  );

  return (
    <MenuSurfaceAnchor className={className}>
      <MenuSurface
        tabIndex={-1}
        open={menuOpen}
        onFocus={(event: SyntheticEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          inputRef.current?.focus();
        }}
        className={styles.surface}
        anchorCorner='bottomStart'
        renderToPortal={renderToPortal ? '#portal' : false}
      >
        <div className={styles.wrapper}>
          <div className={styles.dateSelect}>
            <div className={styles.pagination}>
              <h6 className={styles.month}>
                {selected.toLocaleDateString(locale, {
                  month: 'long',
                  year: 'numeric',
                })}
              </h6>
              <div className={styles.navigation}>
                <IconButton onClick={viewPrevMonth} icon='chevron_left' />
                <IconButton onClick={viewNextMonth} icon='chevron_right' />
              </div>
            </div>
            <div className={styles.weekdays}>
              {Array(7)
                .fill(null)
                .map((_, idx) => (
                  <div className={styles.weekday} key={`day-${idx}`}>
                    {getDate(idx as DayAlias, 0).toLocaleDateString(locale, {
                      weekday: 'narrow',
                    })}
                  </div>
                ))}
            </div>
            <div className={styles.dates}>
              {Array(getDaysInMonth(selected.getMonth()))
                .fill(null)
                .map((_, idx) => (
                  <IconButton
                    type='button'
                    icon={idx + 1}
                    key={`date-${idx}`}
                    disabled={!dateAvailability[idx]}
                    className={cn(styles.date, {
                      [styles.active]: idx + 1 === selected.getDate(),
                    })}
                    style={{
                      gridColumn:
                        idx === 0
                          ? getWeekdayOfFirst(selected.getMonth()) + 1
                          : undefined,
                    }}
                    onClick={() => {
                      setDate(idx + 1);
                      setTimeslotSelectOpen(true);
                    }}
                  />
                ))}
            </div>
          </div>
          <animated.div style={props} className={styles.timeslotSelectWrapper}>
            <div ref={ref} className={styles.timeslotSelect}>
              <h6 className={styles.day}>
                {selected.toLocaleDateString(locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h6>
              <div className={styles.times}>
                {availabilityOnSelected.map((timeslot) => (
                  <Button
                    outlined
                    className={styles.time}
                    key={timeslot.from.toJSON()}
                    label={timeslot.from.toLocaleString(locale, {
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true,
                    })}
                    onClick={() => {
                      onChange(timeslot);
                      inputRef.current?.blur();
                    }}
                  />
                ))}
              </div>
            </div>
          </animated.div>
        </div>
      </MenuSurface>
      <TextField
        {...textFieldProps}
        readOnly
        textarea={false}
        inputRef={inputRef}
        value={value?.toString(locale) || ''}
        className={styles.field}
        onFocus={() => {
          if (onFocused) onFocused();
          openMenu();
        }}
        onBlur={() => {
          if (onBlurred) onBlurred();
          closeMenu();
        }}
      />
    </MenuSurfaceAnchor>
  );
}
