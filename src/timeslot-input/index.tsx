import React from 'react';
import { Select } from '@rmwc/select';
import { Availability, Timeslot } from '@tutorbook/model';

/**
 * The `TimeslotInput` was designed to be as fluid as possible (which is why
 * most props are optional).
 * @typedef {Object} TimeslotInputProps
 * @property onChange - The change handler that is called with our currently
 * selected `Timeslot` every time the user makes a valid (parsable) change.
 * @property [className] - An optional `className` to pass to the `Select`.
 * @property [val] - An optional `Timeslot` to pre-fill or control the input.
 * @property [availability] - An optional `Availability` object from which we
 * check to ensure that the selected `Timeslot` fits within the available times.
 * @property [err] - The error message to show when the user selects a time that
 * isn't in the given availability.
 */
interface TimeslotInputProps {
  value: Timeslot;
  onChange: (timeslot: Timeslot) => any;
  availability: Availability;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function TimeslotInput({
  value,
  availability,
  onChange,
  label,
  placeholder,
  className,
  required,
}: TimeslotInputProps): JSX.Element {
  let fitsWithinAvailability: boolean = false;
  for (const timeslot of availability) {
    if (timeslot.contains(value)) {
      fitsWithinAvailability = true;
      break;
    }
  }
  const options: Timeslot[] = [];
  const millisecondsInThirtyMinutes: number = 30 * 60 * 1000;
  for (const timeslot of availability) {
    let start: Date = timeslot.from;
    let end: Date = new Date(start.getTime() + millisecondsInThirtyMinutes);
    while (end.getTime() <= timeslot.to.getTime()) {
      options.push(new Timeslot(start, end));
      start = end;
      end = new Date(start.getTime() + millisecondsInThirtyMinutes);
    }
  }
  return (
    <Select
      enhanced
      outlined
      label={label}
      placeholder={placeholder}
      className={className}
      required={required}
      value={fitsWithinAvailability ? value.toParsableString() : ''}
      options={options.map((timeslot: Timeslot) => timeslot.toParsableString())}
      onChange={(event: React.FormEvent<HTMLSelectElement>) => {
        onChange(Timeslot.fromString(event.currentTarget.value));
      }}
    />
  );
}
