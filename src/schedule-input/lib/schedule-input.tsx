import React from 'react';
import Button from '@tutorbook/button';
import { Checkbox } from '@rmwc/checkbox';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';
import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  DataTableBody,
  DataTableCell,
} from '@rmwc/data-table';

import { Timeslot, Availability } from './model';
import styles from './schedule-input.module.scss';

// TODO: Remove this and support multiple languages.
const DAYS: Readonly<string[]> = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Number representing the day of the week. Follows the ECMAScript Date
 * convention where 0 denotes Sunday, 1 denotes Monday, etc.
 * @see {@link https://mzl.la/34l2dN6}
 */
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface ScheduleInputState {
  readonly menuOpen: boolean;
  readonly availability: Availability;
}

interface UniqueScheduleInputProps {
  onChange: (availability: Availability) => any;
  className?: string;
}

/**
 * @todo Look at these (and the other) intersection type definitions in detail.
 * @see {@link https://bit.ly/2xaPeBH}
 */
export type ScheduleInputProps = UniqueScheduleInputProps &
  (TextFieldProps | TextFieldHTMLProps);

export default class ScheduleInput extends React.Component<ScheduleInputProps> {
  state: ScheduleInputState;

  /**
   * Timeslots that users can choose their availability from: either morning
   * (7am to 12pm), afternoon (12pm to 5pm), or evening (5pm to 10pm).
   */
  static times: Readonly<Timeslot[]> = [
    new Timeslot(
      ScheduleInput.getNextDateWithTime(7, 0, 0, 1),
      ScheduleInput.getNextDateWithTime(12)
    ),
    new Timeslot(
      ScheduleInput.getNextDateWithTime(12, 0, 0, 1),
      ScheduleInput.getNextDateWithTime(17)
    ),
    new Timeslot(
      ScheduleInput.getNextDateWithTime(17, 0, 0, 1),
      ScheduleInput.getNextDateWithTime(7)
    ),
  ];

  constructor(props: ScheduleInputProps) {
    super(props);
    this.state = {
      menuOpen: false,
      availability: new Availability(),
    };
  }

  /**
   * Returns the next date (from now) that has the given times.
   */
  static getNextDateWithTime(
    hours: number,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0
  ): Date {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      seconds,
      milliseconds
    );
  }

  /**
   * Returns the next date (from now) that has the given day and a time that
   * matches the given date's time.
   */
  static getNextDateWithDay(day: Day, time?: Date): Date {
    const now = new Date();
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      time ? time.getHours() : 0,
      time ? time.getMinutes() : 0,
      time ? time.getSeconds() : 0,
      time ? time.getMilliseconds() : 0
    );
    let count = 0; // TODO: Why did we add this counter in `@tutorbook/utils`?
    while (date.getDay() !== day && count <= 256) {
      date.setDate(date.getDate() + 1);
      count++;
    }
    return date;
  }

  /**
   * Gets all of the timeslots that are available for selection. Right now, our
   * selection tool emulates that of Wyzant (i.e. it's just a grid of times and
   * checkboxes; 'morning', 'afternoon', and 'evening' on the x-axis and the
   * various days on the y-axis). This returns those timeslots open for
   * selection (e.g. 'Mondays from 7am to 12pm' --> 'Mondays morning').
   */
  static get timeslots(): Availability {
    const timeslots = new Availability();
    for (let day = 0; day < 7; day++)
      for (const time of ScheduleInput.times)
        timeslots.push(
          new Timeslot(
            ScheduleInput.getNextDateWithDay(day as Day, time.from),
            ScheduleInput.getNextDateWithDay(day as Day, time.to)
          )
        );
    return timeslots;
  }

  /**
   * Returns whether or not a checkbox should be checked by seeing if the given
   * timeslot exists in `this.state.availability`. If it does, this function
   * returns `true`. If not, `false`.
   * @todo Make the `isMatch` function a method in the `Timeslot` class.
   */
  isChecked(time: Timeslot): boolean {
    return this.state.availability.hasTimeslot(time);
  }

  /**
   * Sets the timeslot as checked by modifying `this.state.availability`:
   * 1. First, this function removes any matching timeslots from
   * `this.state.availability`.
   * 2. If it was checked, this function adds the timeslot to
   * `this.state.availability`.
   * @todo Make the `isMatch` function a method in the `Timeslot` class.
   */
  setChecked(
    timeslot: Timeslot,
    event: React.SyntheticEvent<HTMLInputElement>
  ): void {
    const copy = this.state.availability.filter((t) => !t.equalTo(timeslot));
    if (event.currentTarget.checked) copy.push(timeslot);
    this.setState({ availability: copy });
    this.props.onChange(copy);
  }

  /**
   * All props (except `onChange` and `className`) are delegated to the
   * `TextField` element.
   */
  render(): JSX.Element {
    const { onChange, className, ...rest } = this.props;
    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          open={this.state.menuOpen}
          onClose={(evt) => this.setState({ menuOpen: false })}
          anchorCorner='topStart'
        >
          <DataTable>
            <DataTableContent>
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeadCell></DataTableHeadCell>
                  {DAYS.map((day: string) => (
                    <DataTableHeadCell key={day}>{day}</DataTableHeadCell>
                  ))}
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {ScheduleInput.times.map(
                  (timeslot: Timeslot, index: number) => (
                    <DataTableRow key={index}>
                      <DataTableCell>{timeslot.toString()}</DataTableCell>
                      {DAYS.map((day: string, index: number) => {
                        const timeslotCheckboxRepresents = new Timeslot(
                          ScheduleInput.getNextDateWithDay(
                            index as Day,
                            timeslot.from
                          ),
                          ScheduleInput.getNextDateWithDay(
                            index as Day,
                            timeslot.to
                          )
                        );
                        return (
                          <DataTableCell key={day} hasFormControl>
                            <Checkbox
                              checked={this.isChecked(
                                timeslotCheckboxRepresents
                              )}
                              onChange={(evt) => {
                                this.setChecked(
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
          {...rest}
          readOnly
          value={this.state.availability.toString()}
          className={styles.textField}
          onClick={() => this.setState({ menuOpen: true })}
        />
      </MenuSurfaceAnchor>
    );
  }
}
