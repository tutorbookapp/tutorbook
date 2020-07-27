import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { Checkbox } from '@rmwc/checkbox';
import { FormField } from '@rmwc/formfield';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldHTMLProps, TextFieldProps } from '@rmwc/textfield';
import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  DataTableBody,
  DataTableCell,
} from '@rmwc/data-table';
import { Callback, DayAlias, Timeslot, Availability } from 'lib/model';
import { TimeUtils } from 'lib/utils';

import { v4 as uuid } from 'uuid';

import useTranslation from 'next-translate/useTranslation';
import styles from './schedule-input.module.scss';

type OverriddenProps = 'textarea' | 'readOnly' | 'onFocus' | 'onBlur';

interface UniqueScheduleInputProps {
  value: Availability;
  onChange: Callback<Availability>;
  renderToPortal?: boolean;
  focused?: boolean;
  onFocused?: () => any;
  onBlurred?: () => any;
}

export type ScheduleInputProps = Omit<
  TextFieldHTMLProps,
  keyof UniqueScheduleInputProps | OverriddenProps
> &
  Omit<TextFieldProps, keyof UniqueScheduleInputProps | OverriddenProps> &
  UniqueScheduleInputProps;

/**
 * Timeslots that users can choose their availability from: either morning
 * (7am to 12pm), afternoon (12pm to 5pm), or evening (5pm to 10pm).
 */
const times: Readonly<{ [label: string]: Timeslot }> = {
  morning: new Timeslot(
    TimeUtils.getDateWithTime(7),
    TimeUtils.getDateWithTime(12)
  ),
  afternoon: new Timeslot(
    TimeUtils.getDateWithTime(12),
    TimeUtils.getDateWithTime(17)
  ),
  evening: new Timeslot(
    TimeUtils.getDateWithTime(17),
    TimeUtils.getDateWithTime(22)
  ),
};

export default function ScheduleInput({
  value,
  onChange,
  renderToPortal,
  focused,
  onFocused,
  onBlurred,
  className,
  ...textFieldProps
}: ScheduleInputProps): JSX.Element {
  /**
   * Gets all of the timeslots that are available for selection. Right now, our
   * selection tool emulates that of Wyzant (i.e. it's just a grid of times and
   * checkboxes; 'morning', 'afternoon', and 'evening' on the x-axis and the
   * various days on the y-axis). This returns those timeslots open for
   * selection (e.g. 'Mondays from 7am to 12pm' --> 'Mondays morning').
   */
  const timeslots: Availability = useMemo(() => {
    const temp = new Availability();
    for (let day = 0; day < 7; day += 1)
      Object.values(times).forEach((time: Timeslot) =>
        temp.push(
          new Timeslot(
            TimeUtils.getNextDateWithDay(day as DayAlias, time.from),
            TimeUtils.getNextDateWithDay(day as DayAlias, time.to)
          )
        )
      );
    return temp;
  }, []);
  const allTimeslotsChecked: boolean = useMemo(() => {
    return value.equalTo(timeslots);
  }, [timeslots, value]);
  const someTimeslotsChecked: boolean = useMemo(() => {
    return !allTimeslotsChecked && !!value.length;
  }, [allTimeslotsChecked, value]);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const { t, lang: locale } = useTranslation();
  const checkboxId = useMemo(() => uuid(), []);
  const menuTimeoutId = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused]);

  /**
   * We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
   * before toggling. Waiting ensures that the user hasn't clicked on the
   * schedule input menu (and thus called `this.openMenu`).
   * @todo Perhaps we can remove this workaround by passing a callback to
   * `this.setState()`.
   * @see {@link https://bit.ly/2x9eM27}
   */
  const openMenu = useCallback(() => {
    if (menuTimeoutId.current) {
      clearTimeout(menuTimeoutId.current);
      menuTimeoutId.current = undefined;
    }
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    menuTimeoutId.current = setTimeout(() => setMenuOpen(false));
  }, []);

  /**
   * Sets the timeslot as checked by modifying `this.state.availability`:
   * 1. First, this function removes any matching timeslots from
   * `this.state.availability`.
   * 2. If it was checked, this function adds the timeslot to
   * `this.state.availability`.
   */
  const toggleChecked = useCallback(
    (timeslot: Timeslot, event: React.FormEvent<HTMLInputElement>) => {
      const copy: Availability = value.filter(
        (time) => !time.equalTo(timeslot)
      ) as Availability;
      if (event.currentTarget.checked) copy.push(timeslot);
      onChange(copy);
    },
    [onChange, value]
  );
  const isChecked = useCallback(
    (timeslot: Timeslot) => {
      return value.hasTimeslot(timeslot);
    },
    [value]
  );

  /**
   * Either selects all possible timeslots or unselects all timeslots.
   * @todo Perhaps just reset the availability to it's state before the select
   * all checkbox was selected.
   */
  const toggleAllChecked = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      if (event.currentTarget.checked) {
        onChange(timeslots);
      } else {
        onChange(new Availability());
      }
    },
    [onChange, timeslots]
  );

  return (
    <MenuSurfaceAnchor className={className}>
      <MenuSurface
        open={menuOpen}
        onFocus={openMenu}
        onBlur={closeMenu}
        anchorCorner='bottomStart'
        renderToPortal={renderToPortal ? '#portal' : false}
      >
        <DataTable>
          <DataTableContent>
            <DataTableHead>
              <DataTableRow>
                <DataTableCell className={styles.selectAllCell}>
                  <FormField>
                    <Checkbox
                      indeterminate={someTimeslotsChecked}
                      checked={allTimeslotsChecked}
                      onChange={toggleAllChecked}
                      id={checkboxId}
                    />
                    <label htmlFor={checkboxId}>{t('common:select-all')}</label>
                  </FormField>
                </DataTableCell>
                {Array(7)
                  .fill(null)
                  .map((_: null, dayNum: number) => (
                    /* eslint-disable-next-line react/no-array-index-key */
                    <DataTableHeadCell key={dayNum}>
                      {TimeUtils.getNextDateWithDay(
                        dayNum as DayAlias
                      ).toLocaleString(locale, { weekday: 'long' })}
                    </DataTableHeadCell>
                  ))}
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {Object.entries(times).map(
                ([label, timeslot]: [string, Timeslot]) => (
                  <DataTableRow key={label}>
                    <DataTableCell className={styles.rowHeaderCell}>
                      {timeslot.from.toLocaleString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {timeslot.to.toLocaleString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </DataTableCell>
                    {Array(7)
                      .fill(null)
                      .map((_, dayNum: number) => {
                        const timeslotCheckboxRepresents = new Timeslot(
                          TimeUtils.getNextDateWithDay(
                            dayNum as DayAlias,
                            timeslot.from
                          ),
                          TimeUtils.getNextDateWithDay(
                            dayNum as DayAlias,
                            timeslot.to
                          )
                        );
                        /* eslint-disable react/no-array-index-key */
                        return (
                          <DataTableCell
                            key={dayNum}
                            hasFormControl
                            className={styles.checkboxCell}
                          >
                            <Checkbox
                              checked={isChecked(timeslotCheckboxRepresents)}
                              onChange={(evt) =>
                                toggleChecked(timeslotCheckboxRepresents, evt)
                              }
                            />
                          </DataTableCell>
                        );
                        /* eslint-enable react/no-array-index-key */
                      })}
                  </DataTableRow>
                )
              )}
            </DataTableBody>
          </DataTableContent>
        </DataTable>
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
