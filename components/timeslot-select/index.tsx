import React, { useState, useRef, useCallback } from 'react';

import { TimeUtils } from 'lib/utils';
import { Callback, Timeslot } from 'lib/model';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';

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
  const inputRef = useRef<HTMLInputElement>();
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [timeslot, setTimeslot] = useState<Timeslot>(
    new Timeslot(TimeUtils.getDate(3, 1), TimeUtils.getDate(3, 2, 15))
  );

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
            .map(() => (
              <div className={styles.headerWrapper}>
                <h2 className={styles.headerContent}>
                  <div className={styles.day}>MON</div>
                  <div className={styles.num}>28</div>
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
          <div className={styles.grid}>
            <div className={styles.timesWrapper}>
              <div className={styles.times}>
                {Array(24)
                  .fill(null)
                  .map(() => (
                    <div className={styles.timeWrapper}>
                      <span className={styles.timeLabel}>12 PM</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className={styles.rowsWrapper}>
              <div className={styles.rows}>
                <div className={styles.lines}>
                  {Array(24)
                    .fill(null)
                    .map(() => (
                      <div className={styles.line} />
                    ))}
                </div>
                <div className={styles.space} />
                <div className={styles.cells}>
                  <TimeslotRnd value={timeslot} onChange={setTimeslot} />
                  {Array(7)
                    .fill(null)
                    .map(() => (
                      <div className={styles.cell} />
                    ))}
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
        value={value.toString()}
        className={styles.textField}
        onFocus={openMenu}
        onBlur={closeMenu}
      />
    </MenuSurfaceAnchor>
  );
}
