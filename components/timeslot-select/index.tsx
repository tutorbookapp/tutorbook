import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';

import { TimeUtils } from 'lib/utils';
import { Callback, Timeslot, DayAlias } from 'lib/model';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';

import useTranslation from 'next-translate/useTranslation';

import TimeslotRnd from './timeslot-rnd';

import styles from './timeslot-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  value: Timeslot;
  onChange: Callback<Timeslot>;
  renderToPortal?: boolean;
  className?: string;
}

export type TimeslotSelectProps = Omit<
  TextFieldHTMLProps,
  keyof Props | OverridenProps
> &
  Omit<TextFieldProps, keyof Props | OverridenProps> &
  Props;

/**
 * The `TimeslotSelect` emulates the drag-and-resize interface of Google
 * Calendar's event creation UI but on a much smaller scale. We use `react-rnd`
 * within an RMWC `MenuSurface` to craft our UX.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/50}
 */
export default function TimeslotSelect({
  value,
  onChange,
  className,
  renderToPortal,
  ...textFieldProps
}: TimeslotSelectProps): JSX.Element {
  const { lang: locale } = useTranslation();
  
  const rowsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const onScroll = useCallback(() => setScrolled(true), []);

  useLayoutEffect(() => {
    // Scroll to 8:30am by default (assumes 48px per hour).
    if (rowsRef.current && !scrolled) rowsRef.current.scrollTop = 48 * 8 + 24;
  }, [scrolled, menuOpen]);

  useEffect(() => {
    if (rowsRef.current) {
      const rowsEl = rowsRef.current;
      rowsEl.addEventListener('scroll', onScroll);
      return () => rowsEl.removeEventListener('scroll', onScroll);
    }
    return () => {};
  });

  /**
   * We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
   * before toggling. Waiting ensures that the user hasn't clicked on the
   * schedule input menu (and thus called `this.openMenu`).
   * @todo Perhaps we can remove this workaround by passing a callback to
   * `this.setState()`.
   * @see {@link https://bit.ly/2x9eM27}
   */
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
                    {TimeUtils.getNextDateWithDay(
                      weekday as DayAlias
                    ).toLocaleString(locale, { weekday: 'long' }).substr(0, 3)}
                  </div>
                </h2>
              </div>
            ))}
          <div className={styles.scroller} />
        </div>
        <div className={styles.headerCells}>
          <div className={styles.space} />
          {Array(7).fill(null).map(() => <div className={styles.headerCell} />)}
          <div className={styles.scroller} />
        </div>
        <div className={styles.gridWrapper}>
          <ScrollSync>
            <div className={styles.grid}>
              <ScrollSyncPane>
                <div className={styles.timesWrapper}>
                  <div className={styles.times}>
                    {Array(24).fill(null).map((_: null, hour: number) => (
                      <div className={styles.timeWrapper}>
                        <span className={styles.timeLabel}>
                          {TimeUtils.getDateWithTime(hour).toLocaleString(locale, { hour: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSyncPane>
              <ScrollSyncPane>
                <div className={styles.rowsWrapper} ref={rowsRef}>
                  <div className={styles.rows}>
                    <div className={styles.lines}>
                      {Array(24).fill(null).map(() => (
                        <div className={styles.line} />
                      ))}
                    </div>
                    <div className={styles.space} />
                    <div className={styles.cells}>
                      <TimeslotRnd value={value} onChange={onChange} />
                      {Array(7).fill(null).map(() => (
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
        onFocus={openMenu}
        onBlur={closeMenu}
      />
    </MenuSurfaceAnchor>
  );
}
