import React from 'react'
import { TextField, TextFieldProps } from '@rmwc/textfield'
import { ChipSet, Chip } from '@rmwc/chip'

import styles from './subject-select.module.scss'

interface SubjectSelectProps extends TextFieldProps {}

export default class SubjectSelect extends React.Component {
  constructor(props: SubjectSelectProps) {
    super(props);
  }

  render() {
    return (
      <TextField outlined>
      </TextField>
    );
  }
}
