import React from 'react';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import { Timeslot } from '@tutorbook/model';

interface TimeslotInputProps extends TextFieldProps {
  onChange: (timeslot: Timeslot) => any;
  className?: string;
}

export default class TimeslotInput extends React.Component<TimeslotInputProps> {
  public render(): JSX.Element {
    const { onChange, ...rest } = this.props;
    console.log('[DEBUG] Class name:', rest.className);
    return <TextField {...rest} />;
  }
}
