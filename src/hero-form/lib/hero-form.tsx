import React from 'react'
import Form from '@tutorbook/covid-form'

export default function HeroForm() {
  return (
    <Form 
      inputs={[{
        label: 'Subjects you want tutoring for',
        el: 'subjectselect',
        required: true,
      }, {
        label: 'When you want tutoring',
        el: 'textfield',
        required: true,
      }]}
      submitLabel='Request free tutoring'
      onSubmit={(formValues) => new Promise((res, rej) => {})}
    />
  );
}
