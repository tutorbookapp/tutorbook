import React from 'react';
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
import { FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';
import {
  Callback,
  TimeUtils,
  DayAlias,
  Timeslot,
  Availability,
} from '@tutorbook/model';

import { v4 as uuid } from 'uuid';

import styles from './schedule-input.module.scss';

interface ScheduleInputState {
  menuOpen: boolean;
}

type OverriddenProps =
  | 'textarea'
  | 'outlined'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur';

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

export default class ScheduleInput extends React.Component<ScheduleInputProps> {
  public readonly state: ScheduleInputState;
  private menuTimeoutID?: number;
  private inputRef: React.RefObject<HTMLInputElement> = React.createRef();

  public constructor(props: ScheduleInputProps) {
    super(props);
    this.state = { menuOpen: false };
    this.toggleAllChecked = this.toggleAllChecked.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
  }

  public componentDidUpdate(): void {
    if (this.props.focused && this.inputRef.current)
      this.inputRef.current.focus();
  }

  /**
   * We clear the timeout set by `this.closeMenu` to ensure that they user
   * doesn't get a blip where the schedule input menu disappears and reappears
   * abruptly.
   * @see {@link https://bit.ly/2x9eM27}
   */
  private openMenu(): void {
    window.clearTimeout(this.menuTimeoutID);
    if (!this.state.menuOpen) this.setState({ menuOpen: true });
  }

  /**
   * We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
   * before toggling. Waiting ensures that the user hasn't clicked on the
   * schedule input menu (and thus called `this.openMenu`).
   * @see {@link https://bit.ly/2x9eM27}
   */
  private closeMenu(): void {
    this.menuTimeoutID = window.setTimeout(() => {
      if (this.state.menuOpen) this.setState({ menuOpen: false });
    });
  }

  /**
   * Timeslots that users can choose their availability from: either morning
   * (7am to 12pm), afternoon (12pm to 5pm), or evening (5pm to 10pm).
   */
  private static times: Readonly<{ [label: string]: Timeslot }> = {
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

  /**
   * Gets all of the timeslots that are available for selection. Right now, our
   * selection tool emulates that of Wyzant (i.e. it's just a grid of times and
   * checkboxes; 'morning', 'afternoon', and 'evening' on the x-axis and the
   * various days on the y-axis). This returns those timeslots open for
   * selection (e.g. 'Mondays from 7am to 12pm' --> 'Mondays morning').
   */
  public static get timeslots(): Availability {
    const timeslots = new Availability();
    for (let day = 0; day < 7; day++)
      for (const time of Object.values(ScheduleInput.times))
        timeslots.push(
          new Timeslot(
            TimeUtils.getNextDateWithDay(day as DayAlias, time.from),
            TimeUtils.getNextDateWithDay(day as DayAlias, time.to)
          )
        );
    return timeslots;
  }

  /**
   * Returns whether or not a checkbox should be checked by seeing if the given
   * timeslot exists in `this.state.availability`. If it does, this function
   * returns `true`. If not, `false`.
   */
  private isChecked(time: Timeslot): boolean {
    return this.props.value.hasTimeslot(time);
  }

  /**
   * Sets the timeslot as checked by modifying `this.state.availability`:
   * 1. First, this function removes any matching timeslots from
   * `this.state.availability`.
   * 2. If it was checked, this function adds the timeslot to
   * `this.state.availability`.
   */
  private toggleChecked(
    timeslot: Timeslot,
    event: React.FormEvent<HTMLInputElement>
  ): void {
    const copy: Availability = this.props.value.filter(
      (t) => !t.equalTo(timeslot)
    ) as Availability;
    if (event.currentTarget.checked) copy.push(timeslot);
    this.props.onChange(copy);
  }

  /**
   * Either selects all possible timeslots or unselects all timeslots.
   * @todo Perhaps just reset the availability to it's state before the select
   * all checkbox was selected.
   */
  private toggleAllChecked(event: React.FormEvent<HTMLInputElement>): void {
    if (event.currentTarget.checked) {
      this.props.onChange(ScheduleInput.timeslots);
    } else {
      this.props.onChange(new Availability());
    }
  }

  private get allTimeslotsChecked(): boolean {
    return this.props.value.equalTo(ScheduleInput.timeslots);
  }

  /**
   * All props (except `onChange` and `className`) are delegated to the
   * `TextField` element.
   * @todo Perhaps use the `injectIntl` function to use the `intl` API to ensure
   * that the `DataTableHeaderCell`s always contain capitalized day strings.
   * @todo Allow the user to interact with the static content of the menu (i.e.
   * the text that doesn't cause an `onFocus` event when clicked). Right now,
   * interacting with such static content within the menu causes the menu to
   * lose focus which makes us close it.
   */
  public render(): JSX.Element {
    const {
      onChange,
      className,
      renderToPortal,
      focused,
      onFocused,
      onBlurred,
      ...textFieldProps
    } = this.props;
    const checkboxId: string = uuid();
    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          open={this.state.menuOpen}
          onFocus={this.openMenu}
          onBlur={this.closeMenu}
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
                        checked={this.allTimeslotsChecked}
                        onChange={this.toggleAllChecked}
                        id={checkboxId}
                      />
                      <label htmlFor={checkboxId}>
                        <FormattedMessage
                          id='schedule-input.select-all-label'
                          description={
                            'The label for the checkbox that selects all the ' +
                            'times in a schedule input.'
                          }
                          defaultMessage='Select all'
                        />
                      </label>
                    </FormField>
                  </DataTableCell>
                  {Array(7)
                    .fill(null)
                    .map((_: null, dayNum: number) => (
                      <DataTableHeadCell key={dayNum}>
                        <FormattedDate
                          value={TimeUtils.getNextDateWithDay(
                            dayNum as DayAlias
                          )}
                          weekday='long'
                        />
                      </DataTableHeadCell>
                    ))}
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {Object.entries(ScheduleInput.times).map(
                  ([label, timeslot]: [string, Timeslot]) => (
                    <DataTableRow key={label}>
                      <DataTableCell className={styles.rowHeaderCell}>
                        <FormattedTime value={timeslot.from} />
                        {' - '}
                        <FormattedTime value={timeslot.to} />
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
                          return (
                            <DataTableCell
                              key={dayNum}
                              hasFormControl
                              className={styles.checkboxCell}
                            >
                              <Checkbox
                                checked={this.isChecked(
                                  timeslotCheckboxRepresents
                                )}
                                onChange={(evt) => {
                                  this.toggleChecked(
                                    timeslotCheckboxRepresents,
                                    evt
                                  );
                                }}
                              />
                            </DataTableCell>
                          );
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
          outlined
          textarea={false}
          inputRef={this.inputRef}
          value={this.props.value.toString()}
          className={styles.textField}
          onFocus={() => {
            if (onFocused) onFocused();
            this.openMenu();
          }}
          onBlur={() => {
            if (onBlurred) onBlurred();
            this.closeMenu();
          }}
        />
      </MenuSurfaceAnchor>
    );
  }
}
