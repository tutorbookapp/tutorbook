import React from 'react'
import Form from '@tutorbook/covid-form'

import styles from './hero-form.module.scss'

export default function HeroForm() {
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <Form 
            inputs={[{
              label: 'Your name',
              el: 'textfield',
              required: true,
            }, {
              label: 'Your email address',
              el: 'textfield',
              type: 'email',
              required: true,
            }, {
              label: 'Subjects you want tutoring for',
              el: 'subjectselect',
              required: true,
            }, {
              label: 'When you want tutoring',
              el: 'textfield',
              required: true,
            }]}
            submitLabel='Request free tutoring'
            onFormSubmit={(formValues) => new Promise((res, rej) => {})}
            className={styles.heroForm}
            cardProps={{
              className: styles.heroFormCard,
            }}
          />
        </div>
      </div>
      <div className={styles.heroBackground} />
    </>
  );
}
