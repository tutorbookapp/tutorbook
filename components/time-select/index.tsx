import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import {
  FormEvent,
  SyntheticEvent,
  memo,
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
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import cn from 'classnames';
import { dequal } from 'dequal/lite';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';
import { nanoid } from 'nanoid';

import { Availability, AvailabilityJSON, TCallback, Timeslot } from 'lib/model';
import {
  getDate,
  getDaysInMonth,
  getMonthsApart,
  getWeekdayOfFirst,
} from 'lib/utils/time';
import { useClickContext } from 'lib/hooks/click-outside';

import styles from './time-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  uid?: string;
  value?: Timeslot;
  onChange: TCallback<Timeslot>;
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

export default memo(
  function TimeSelect({
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
    const inputRef = useRef<HTMLInputElement>(null);
    useLayoutEffect(() => {
      if (focused) inputRef.current?.focus();
    }, [focused]);

    // We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
    // before toggling which ensures the user hasn't re-opened the menu.
    // @see {@link https:bit.ly/2x9eM27}
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const timeoutId = useRef<ReturnType<typeof setTimeout>>();

    const [ref, { width }] = useMeasure({ polyfill });
    const [selectOpen, setSelectOpen] = useState<boolean>(!!value);
    const props = useSpring({
      width: selectOpen ? width : 0,
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

    useEffect(() => {
      if (month < 0 || month > 11) {
        setMonth(month < 0 ? (month % 12) + 12 : month % 12);
        setYear((prev) => prev + Math.floor(month / 12));
      }
    }, [month]);

    const { data } = useSWR<AvailabilityJSON>(
      uid ? `/api/users/${uid}/availability?month=${month}&year=${year}` : null
    );
    const availability = useMemo(
      () =>
        data ? Availability.fromJSON(data) : Availability.full(month, year),
      [data, month, year]
    );
    const availabilityOnSelected = useMemo(
      () => availability.onDate(selected),
      [selected, availability]
    );
    const dateAvailability = useMemo(
      () =>
        Array(getDaysInMonth(month))
          .fill(null)
          .map((_, idx) =>
            availability.hasDate(new Date(year, month, idx + 1))
          ),
      [year, month, availability]
    );

    const { updateEl, removeEl } = useClickContext();
    const elementId = useRef<string>(`time-select-${nanoid()}`);
    const menuSurfaceRef = useCallback(
      (node: HTMLElement | null) => {
        if (!node) return removeEl(elementId.current);
        return updateEl(elementId.current, node);
      },
      [updateEl, removeEl]
    );

    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          tabIndex={-1}
          open={menuOpen}
          ref={menuSurfaceRef}
          onFocus={(event: SyntheticEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            inputRef.current?.focus();
          }}
          className={styles.surface}
          anchorCorner='bottomStart'
          renderToPortal={renderToPortal ? '#portal' : false}
          data-cy='time-select-surface'
        >
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
                    icon='chevron_left'
                    onClick={viewPrevMonth}
                    disabled={getMonthsApart(selected) <= 0}
                    data-cy='prev-month-button'
                  />
                  <IconButton
                    icon='chevron_right'
                    onClick={viewNextMonth}
                    disabled={getMonthsApart(selected) >= 3}
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
                          idx === 0
                            ? getWeekdayOfFirst(month, year) + 1
                            : undefined,
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
            <animated.div
              style={props}
              className={styles.timeslotSelectWrapper}
            >
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
  },
  (prevProps: TimeSelectProps, nextProps: TimeSelectProps) => {
    return dequal(prevProps, nextProps);
  }
);
