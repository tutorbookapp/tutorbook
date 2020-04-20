import React from 'react';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import {
  Day,
  DayAlias,
  Availability,
  TimeUtils,
  Timeslot,
} from '@tutorbook/model';

import styles from './timeslot-input.module.scss';

/**
 * The `TimeslotInput` was designed to be as fluid as possible (which is why
 * most props are optional).
 * @typedef {Object} TimeslotInputProps
 * @property onChange - The change handler that is called with our currently
 * selected `Timeslot` every time the user makes a valid (parsable) change.
 * @property [className] - An optional `className` to pass to the `TextField`.
 * @property [val] - An optional `Timeslot` to pre-fill or control the input.
 * @property [availability] - An optional `Availability` object from which we
 * check to ensure that the selected `Timeslot` fits within the available times.
 */
interface TimeslotInputProps extends TextFieldProps {
  readonly onChange: (timeslot: Timeslot) => any;
  readonly className?: string;
  readonly val?: Timeslot;
  readonly availability?: Availability;
}

interface TimeslotInputState {
  readonly val?: Timeslot;
  readonly err?: string;
  readonly value: string;
}

/**
 * Input React component that enables the user to select:
 * - A weekday (all appointments are recurring weekly by default).
 * - A `from` or `open` time (when the appointment should start).
 * - A `to` or `close` time (when the appointment should end).
 *
 * This should just be a pretty basic wrapper around a `TextField` component
 * that provides validation and parses the user input into a `Timeslot` object.
 */
export default class TimeslotInput extends React.Component<TimeslotInputProps> {
  public readonly state: TimeslotInputState;

  public constructor(props: TimeslotInputProps) {
    super(props);
    this.state = {
      value: props.val ? props.val.toParsableString() : '',
      val: props.val,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  /**
   * Valid input formats are as follows:
   * > Mondays from 2pm to 3pm.
   * > Tuesday from 2:23pm to 3:36pm.
   * > Saturdays from 2:35pm to 4:45 PM.
   * > Sundays from 4:45 PM to 3:45 AM.
   * > Sunday from 4:45PM to 8AM.
   * @todo Actually support all of the above formats (for our MVP, we only
   * support the first two).
   *
   * This method:
   * 1. Validates the user input; shows an error message if it's invalid.
   * 2. Updates `this.state.val` and calls the `onChange` listener with the
   * updated `Timeslot` object.
   */
  private handleChange(event: React.SyntheticEvent<HTMLInputElement>): void {
    this.setState({ value: event.currentTarget.value });
    try {
      const timeslot: Timeslot = this.timeslot;
      let fitsWithinAvailability: boolean = !this.props.availability;
      if (this.props.availability)
        for (const t of this.props.availability) {
          if (t.contains(timeslot)) {
            fitsWithinAvailability = true;
            break;
          }
        }
      if (fitsWithinAvailability) {
        this.setState({
          err: undefined,
          val: timeslot,
        });
        this.props.onChange(timeslot);
      } else {
        this.setState({
          err: 'Please input a time that fits within the availability.',
        });
      }
    } catch (e) {
      this.setState({ err: 'Please format your input correctly.' });
    }
  }

  /**
   * Parses an input (see below for examples) into a `Timeslot`:
   * > Mondays at 3:00 PM to 4:00 PM.
   * > Monday at 3:00 PM to 3:30 PM.
   * This getter should only ever be called within a `try{} catch {}` sequence
   * b/c it will throw an error every time if `this.state.value` isn't parsable.
   */
  private get timeslot(): Timeslot {
    const split: string[] = this.state.value.split(' ');
    if (split.length !== 7) throw new Error('Invalid time string.');

    const dayStr: string = split[0];
    const fromStr: string = split[2];
    const fromAMPM: string = split[3];
    const toStr: string = split[5];
    const toAMPM: string = split[6];

    const day: keyof typeof Day = (dayStr.endsWith('s')
      ? dayStr.slice(0, -1)
      : dayStr) as keyof typeof Day;
    const dayNum: DayAlias = Day[day];

    let fromHr: number = new Number(fromStr.split(':')[0]).valueOf();
    const fromMin: number = new Number(fromStr.split(':')[1]).valueOf();
    if (fromAMPM === 'PM') {
      fromHr += 12;
    } else if (fromAMPM !== 'AM') {
      throw new Error('Invalid AM/PM format for from time.');
    }

    let toHr: number = new Number(toStr.split(':')[0]).valueOf();
    const toMin: number = new Number(toStr.split(':')[1]).valueOf();
    if (toAMPM === 'PM' || toAMPM === 'PM.') {
      toHr += 12;
    } else if (toAMPM !== 'AM' && toAMPM !== 'AM.') {
      throw new Error('Invalid AM/PM format for to time.');
    }

    const timeslot: Timeslot = new Timeslot(
      TimeUtils.getDate(dayNum, fromHr, fromMin),
      TimeUtils.getDate(dayNum, toHr, toMin)
    );
    return timeslot;
  }

  public render(): JSX.Element {
    const { onChange, className, availability, val, ...rest } = this.props;
    return (
      <div className={styles.wrapper + (className ? ' ' + className : '')}>
        <TextField
          {...rest}
          placeholder='Ex. Mondays from 3:00 PM to 3:45 PM'
          className={styles.textField}
          value={this.state.value}
          onChange={this.handleChange}
          invalid={!!this.state.err}
          helpText={
            !!this.state.err && {
              validationMsg: true,
              children: this.state.err,
            }
          }
        />
      </div>
    );
  }
}
