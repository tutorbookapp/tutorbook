import { FormEvent, useCallback, useMemo } from 'react';
import { Select, SelectHTMLProps, SelectProps } from '@rmwc/select';

import { TCallback } from 'lib/model';

const rrules: Record<string, string> = {
  Daily: 'RRULE:FREQ=DAILY',
  Weekly: 'RRULE:FREQ=WEEKLY',
  Biweekly: 'RRULE:FREQ=WEEKLY;INTERVAL=2',
  Monthly: 'RRULE:FREQ=MONTHLY',
};

function inverse(record: Record<string, string>): Record<string, string> {
  const inverted: Record<string, string> = {};
  Object.entries(record).forEach(([key, val]) => {
    inverted[val] = key;
  });
  return inverted;
}

export type RecurSelectProps = {
  value: string;
  onChange: TCallback<string>;
} & Omit<SelectProps, 'value' | 'onChange'> &
  Omit<SelectHTMLProps, 'value' | 'onChange'>;

// TODO: Allow this to be rendered to portal by capturing clicks on the enhanced
// menu surface. See: https://github.com/jamesmfriedman/rmwc/pull/723
export default function RecurSelect({
  value,
  onChange,
  ...props
}: RecurSelectProps): JSX.Element {
  const onSelectChange = useCallback(
    (evt: FormEvent<HTMLSelectElement>) => {
      onChange(rrules[evt.currentTarget.value] || '');
    },
    [onChange]
  );
  const selectValue = useMemo(() => inverse(rrules)[value] || '', [value]);

  return (
    <Select
      options={['Daily', 'Weekly', 'Biweekly', 'Monthly']}
      onChange={onSelectChange}
      value={selectValue}
      enhanced
      {...props}
    />
  );
}
