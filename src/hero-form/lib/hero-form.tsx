import React from 'react';
import Form from '@tutorbook/covid-form';
import { useDB } from '@tutorbook/next-firebase/db';

import styles from './hero-form.module.scss';

export default function HeroForm() {
  const db = useDB();
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <Form
            inputs={[
              {
                label: 'Your name',
                el: 'textfield',
                required: true,
              },
              {
                label: 'Your email address',
                el: 'textfield',
                type: 'email',
                required: true,
              },
              {
                label: 'Subjects you want tutoring for',
                el: 'subjectselect',
                required: true,
              },
              {
                label: 'When you want tutoring',
                el: 'scheduleinput',
                required: true,
              },
            ]}
            submitLabel='Request free tutoring'
            onFormSubmit={(formValues) => {
              return db.collection('pupils').doc().set(formValues);
            }}
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
