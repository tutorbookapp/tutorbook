import React from 'react'
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield'
import { ChipSet, Chip } from '@rmwc/chip'

import styles from './subject-select.module.scss'

interface SubjectSelectProps extends TextFieldProps {
  onChange: (event: React.SyntheticEvent<HTMLInputElement>) => any;
  className?: string;
}

export default class SubjectSelect extends React.Component<SubjectSelectProps> {
  constructor(props: SubjectSelectProps) {
    super(props);
  }

  render() {
    return (
      <TextField {...this.props} outlined>
      </TextField>
    );
  }
}
