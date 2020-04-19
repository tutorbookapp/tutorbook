import React from 'react';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import { Availability, Timeslot } from '@tutorbook/model';

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
    this.state = { value: '', val: props.val };
  }

  /**
   * Valid input formats are as follows:
   * > Mondays from 2pm to 3pm.
   * > Tuesday from 2:23pm to 3:36pm.
   * > Saturdays from 2:35pm to 4:45 PM.
   * > Sundays from 4:45 PM to 3:45 AM.
   * > Sunday from 4:45PM to 8AM.
   * This getter will first check if the current `this.state.value` is parsable
   * (i.e. it fits with the above definitions). Then, it'll ensure that the time
   * is within `this.props.availability`. Once both of those checks pass, it'll
   * `return true`.
   * @todo Actually support all of the above formats (for our MVP, we only
   * support the first two).
   */
  private get valid(): boolean {
    const split: string[] = this.state.value.split(' ');
    if (split.length !== 5) return false;
    const day: string = split[0];
    const from: string = split[2];
    const to: string = split[4].replace('.', '');
  }

  /**
   * Checks if the current `this.state.value` is valid. If it is, we parse it
   * and update `this.state.val` as needed. Otherwise, we show the `TextField`
   * as invalid and display a helper message.
   */
  private update(): void {}

  public render(): JSX.Element {
    const { onChange, ...rest } = this.props;
    return <TextField {...rest} type='time' />;
  }
}
