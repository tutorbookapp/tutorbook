import React from 'react'
import Schedule from '@tutorbook/react-schedule'

interface ScheduleInputProps {
  onChange: (event: React.SyntheticEvent<HTMLInputElement>) => any;
  className?: string;
}

export default class ScheduleInput extends React.Component<ScheduleInputProps> {
  render(): JSX.Element {
    return <Schedule />
  }
}
