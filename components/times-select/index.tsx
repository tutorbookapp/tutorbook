import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import {
  SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { TextField, TextFieldHTMLProps, TextFieldProps } from '@rmwc/textfield';
import { animated, useSpring } from 'react-spring';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';
import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';
import useMeasure from 'react-use-measure';

import { Availability, Callback } from 'lib/model';

import styles from './times-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  value: Availability;
  onChange: Callback<Availability>;
  options?: Availability;
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
  options,
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
  const toggleTimeslotSelect = useCallback(
    () => setTimeslotSelectOpen((prev) => !prev),
    []
  );
  const props = useSpring({
    width: timeslotSelectOpen ? width : 0,
    tension: 200,
  });

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
              <h6 className={styles.month}>October 2020</h6>
              <div className={styles.navigation}>
                <IconButton icon='chevron_left' />
                <IconButton icon='chevron_right' />
              </div>
            </div>
            <div className={styles.weekdays}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div className={styles.weekday} key={idx}>
                  {day}
                </div>
              ))}
            </div>
            <div className={styles.dates}>
              {Array(28)
                .fill(null)
                .map((_, idx) => (
                  <IconButton
                    type='button'
                    onClick={toggleTimeslotSelect}
                    className={cn(styles.date, { [styles.active]: idx === 21 })}
                    icon={idx + 1}
                  />
                ))}
            </div>
          </div>
          <animated.div style={props} className={styles.timeslotSelectWrapper}>
            <div ref={ref} className={styles.timeslotSelect}>
              <h6 className={styles.day}>Thursday, October 22</h6>
              <div className={styles.times}>
                {[
                  '9:00 am',
                  '10:00 am',
                  '11:00 am',
                  '1:00 pm',
                  '2:00 pm',
                  '3:00 pm',
                  '4:00 pm',
                ].map((time) => (
                  <Button className={styles.time} outlined label={time} />
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
        value={value.toString()}
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
