import React from 'react';
import { Checkbox } from '@rmwc/checkbox';
import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  DataTableBody,
  DataTableCell,
} from '@rmwc/data-table';
import { TimeUtils, DayAlias, Timeslot, Availability } from '@tutorbook/model';

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

interface ScheduleInputState {
  readonly menuOpen: boolean;
  readonly availability: Availability;
}

export interface ScheduleInputProps extends TextFieldProps {
  onChange: (availability: Availability) => any;
  className?: string;
  val?: Availability;
}

export default class ScheduleInput extends React.Component<ScheduleInputProps> {
  public readonly state: ScheduleInputState;

  public constructor(props: ScheduleInputProps) {
    super(props);
    this.state = {
      menuOpen: false,
      availability: props.val || new Availability(),
    };
  }

  /**
   * Timeslots that users can choose their availability from: either morning
   * (7am to 12pm), afternoon (12pm to 5pm), or evening (5pm to 10pm).
   */
  private static times: Readonly<Timeslot[]> = [
    new Timeslot(TimeUtils.getDateWithTime(7), TimeUtils.getDateWithTime(12)),
    new Timeslot(TimeUtils.getDateWithTime(12), TimeUtils.getDateWithTime(17)),
    new Timeslot(TimeUtils.getDateWithTime(17), TimeUtils.getDateWithTime(22)),
  ];

  /**
   * Gets all of the timeslots that are available for selection. Right now, our
   * selection tool emulates that of Wyzant (i.e. it's just a grid of times and
   * checkboxes; 'morning', 'afternoon', and 'evening' on the x-axis and the
   * various days on the y-axis). This returns those timeslots open for
   * selection (e.g. 'Mondays from 7am to 12pm' --> 'Mondays morning').
   * @todo Perhaps remove this unused getter and document the above information
   * elsewhere.
   */
  public static get timeslots(): Availability {
    const timeslots = new Availability();
    for (let day = 0; day < 7; day++)
      for (const time of ScheduleInput.times)
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
   * @todo Make the `isMatch` function a method in the `Timeslot` class.
   */
  private isChecked(time: Timeslot): boolean {
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
  private setChecked(
    timeslot: Timeslot,
    event: React.FormEvent<HTMLInputElement>
  ): void {
    const copy: Availability = this.state.availability.filter(
      (t) => !t.equalTo(timeslot)
    ) as Availability;
    if (event.currentTarget.checked) copy.push(timeslot);
    this.setState({ availability: copy });
    this.props.onChange(copy);
  }

  /**
   * All props (except `onChange` and `className`) are delegated to the
   * `TextField` element.
   */
  public render(): JSX.Element {
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
                          TimeUtils.getNextDateWithDay(
                            index as DayAlias,
                            timeslot.from
                          ),
                          TimeUtils.getNextDateWithDay(
                            index as DayAlias,
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
