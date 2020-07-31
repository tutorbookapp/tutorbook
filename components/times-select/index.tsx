import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';

import { TimeUtils } from 'lib/utils';
import { Callback, Timeslot, Availability, DayAlias } from 'lib/model';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';

import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import OptionRnd from './option-rnd';
import TimeslotRnd from './timeslot-rnd';

import { getTimeslot } from './utils';
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

/**
 * The `TimesSelect` emulates the drag-and-resize interface of Google
 * Calendar's event creation UI but on a much smaller scale. We use `react-rnd`
 * within an RMWC `MenuSurface` to craft our UX.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/50}
 */
export default function TimesSelect({
  value,
  onChange,
  options = Availability.full(),
  renderToPortal,
  focused,
  onFocused,
  onBlurred,
  className,
  ...textFieldProps
}: TimesSelectProps): JSX.Element {
  const { lang: locale } = useTranslation();

  const rowsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();

  const [cellsRef, { x, y }] = useMeasure({ polyfill, scroll: true });
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused]);

  useLayoutEffect(() => {
    // Scroll to 8:30am by default (assumes 48px per hour).
    if (rowsRef.current && !scrolled) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, [scrolled, menuOpen]);

  // We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
  // before toggling which ensures the user hasn't re-opened the menu.
  // @see {@link https:bit.ly/2x9eM27}
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

  // Create a new `TimeslotRND` closest to the user's click position. Assumes
  // each column is 82px wide and every hour is 48px tall (i.e. 12px = 15min).
  const onClick = useCallback(
    (event: React.MouseEvent) => {
      const position = { x: event.pageX - x, y: event.pageY - y };
      onChange(new Availability(...value, getTimeslot(48, position)));
    },
    [x, y, onChange, value]
  );
  const onScroll = useCallback(() => setScrolled(true), []);

  return (
    <MenuSurfaceAnchor className={className}>
      <MenuSurface
        tabIndex={-1}
        open={menuOpen}
        onFocus={openMenu}
        onBlur={closeMenu}
        anchorCorner='bottomStart'
        className={styles.menuSurface}
        renderToPortal={renderToPortal ? '#portal' : false}
      >
        <div className={styles.headers}>
          <div className={styles.space} />
          {Array(7)
            .fill(null)
            .map((_: null, weekday: number) => (
              <div className={styles.headerWrapper}>
                <h2 className={styles.headerContent}>
                  <div className={styles.day}>
                    {TimeUtils.getNextDateWithDay(weekday as DayAlias)
                      .toLocaleString(locale, { weekday: 'long' })
                      .substr(0, 3)}
                  </div>
                </h2>
              </div>
            ))}
          <div className={styles.scroller} />
        </div>
        <div className={styles.headerCells}>
          <div className={styles.space} />
          {Array(7)
            .fill(null)
            .map(() => (
              <div className={styles.headerCell} />
            ))}
          <div className={styles.scroller} />
        </div>
        <div className={styles.gridWrapper}>
          <ScrollSync>
            <div className={styles.grid}>
              <ScrollSyncPane>
                <div className={styles.timesWrapper}>
                  <div className={styles.times}>
                    {Array(24)
                      .fill(null)
                      .map((_: null, hour: number) => (
                        <div className={styles.timeWrapper}>
                          <span className={styles.timeLabel}>
                            {TimeUtils.getDateWithTime(
                              hour
                            ).toLocaleString(locale, { hour: '2-digit' })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </ScrollSyncPane>
              <ScrollSyncPane>
                <div
                  className={styles.rowsWrapper}
                  ref={rowsRef}
                  onScroll={onScroll}
                >
                  <div className={styles.rows}>
                    <div className={styles.lines}>
                      {Array(24)
                        .fill(null)
                        .map(() => (
                          <div className={styles.line} />
                        ))}
                    </div>
                    <div className={styles.space} />
                    <div
                      className={styles.cells}
                      onClick={onClick}
                      ref={cellsRef}
                    >
                      {options.map((timeslot: Timeslot) => (
                        <OptionRnd value={timeslot} />
                      ))}
                      {value.map((timeslot: Timeslot, idx: number) => (
                        <TimeslotRnd
                          value={timeslot}
                          onChange={(updated: Timeslot) => {
                            onChange(
                              new Availability(
                                ...value.slice(0, idx),
                                updated,
                                ...value.slice(idx + 1)
                              )
                            );
                          }}
                        />
                      ))}
                      {Array(7)
                        .fill(null)
                        .map(() => (
                          <div className={styles.cell} />
                        ))}
                    </div>
                  </div>
                </div>
              </ScrollSyncPane>
            </div>
          </ScrollSync>
        </div>
      </MenuSurface>
      <TextField
        {...textFieldProps}
        readOnly
        textarea={false}
        inputRef={inputRef}
        value={value.toString()}
        className={styles.textField}
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
