import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
} from 'react';
import { TextField, TextFieldHTMLProps, TextFieldProps } from '@rmwc/textfield';
import { animated, useSpring } from 'react-spring';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';
import cn from 'classnames';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import { Availability, Timeslot, Callback } from 'lib/model';
import { getDate, getDaysInMonth, getWeekdayOfFirst } from 'lib/utils/time';

import styles from './times-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  value?: Timeslot;
  onChange: Callback<Timeslot | undefined>;
  availability: Availability;
  renderToPortal?: boolean;
  focused?: boolean;
  onFocused?: () => any;
  onBlurred?: () => any;
  className?: string;
}

export type TimesSelectProps = Omit<
  TextFieldHTMLProps,
  keyof Props | OverridenProps
> &
  Omit<TextFieldProps, keyof Props | OverridenProps> &
  Props;

export default function TimesSelect({
  value,
  onChange,
  availability,
  renderToPortal,
  focused,
  onFocused,
  onBlurred,
  className,
  ...textFieldProps
}: TimesSelectProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useLayoutEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
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
  const [timeslotSelectOpen, setTimeslotSelectOpen] = useState<boolean>(false);
  const props = useSpring({
    width: timeslotSelectOpen ? width : 0,
    tension: 200,
  });

  const { t } = useTranslation();

  const [date, setDate] = useState<number>(
    (value?.from || new Date()).getDate()
  );
  const [month, setMonth] = useState<number>(
    (value?.from || new Date()).getMonth()
  );
  const viewPrevMonth = useCallback(() => setMonth((prev) => prev - 1), []);
  const viewNextMonth = useCallback(() => setMonth((prev) => prev + 1), []);
  const dte = useMemo(() => {
    return value?.from || new Date(new Date().getFullYear(), month, date);
  }, [value?.from, month, date]);

  const availabilityOnDate = useMemo(() => {
    return availability.onDate(dte);
  }, [dte, availability]);
  const availableOnDates = useMemo(() => {
    return Array(getDaysInMonth)
      .fill(null)
      .map((_, idx) =>
        availability.hasDate(
          new Date(dte.getFullYear(), dte.getMonth(), idx + 1)
        )
      );
  }, [dte, availability]);

  return (
    <MenuSurfaceAnchor className={className}>
      <MenuSurface
        tabIndex={-1}
        open={menuOpen}
        onFocus={(event: SyntheticEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          if (inputRef.current) inputRef.current.focus();
        }}
        className={styles.surface}
        anchorCorner='bottomStart'
        renderToPortal={renderToPortal ? '#portal' : false}
      >
        <div className={styles.wrapper}>
          <div className={styles.dateSelect}>
            <div className={styles.pagination}>
              <h6 className={styles.month}>
                {`${t(`common:mo-${dte.getMonth()}`)} ${dte.getFullYear()}`}
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
                    {t(`common:dy-${idx}`)[0]}
                  </div>
                ))}
            </div>
            <div className={styles.dates}>
              {Array(getDaysInMonth(dte.getMonth()))
                .fill(null)
                .map((_, idx) => (
                  <IconButton
                    type='button'
                    icon={idx + 1}
                    key={`date-${idx}`}
                    disabled={!availableOnDates[idx]}
                    className={cn(styles.date, {
                      [styles.active]: idx + 1 === dte.getDate(),
                    })}
                    style={{
                      gridColumn:
                        idx === 0
                          ? getWeekdayOfFirst(dte.getMonth()) + 1
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
                {`${t(`common:dy-${dte.getDay()}`)}, ${t(
                  `common:mo-${dte.getMonth()}`
                )} ${dte.getDate()}`}
              </h6>
              <div className={styles.times}>
                {availabilityOnDate.map((timeslot) => (
                  <Button
                    outlined
                    className={styles.time}
                    key={timeslot.from.toJSON()}
                    label={timeslot.from.toLocaleString('en-US', {
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true,
                    })}
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
        value={value?.toString() || ''}
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
