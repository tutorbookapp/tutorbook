import React from 'react';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { useDB } from '@tutorbook/next-firebase/db';
import { User } from '@tutorbook/model';

import styles from './hero-form.module.scss';

/**
 * React component that emulates AirBNB's landing page form and collects the
 * following information from pupils (and creates their Firestore user document
 * along the way).
 * - (name) Your name
 * - (email) Your email address
 * - (searches.explicit) What would you like to learn?
 * - (availability) When are you available?
 */
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
                el: 'textfield' as InputElAlias,
                required: true,
                key: 'name',
              },
              {
                label: 'Your email address',
                el: 'textfield' as InputElAlias,
                type: 'email',
                required: true,
                key: 'email',
              },
              {
                label: 'What would you like to learn?',
                el: 'subjectselect' as InputElAlias,
                required: true,
                key: 'searches',
              },
              {
                label: 'When are you available?',
                el: 'scheduleinput' as InputElAlias,
                required: true,
                key: 'availability',
              },
            ]}
            submitLabel='Request free tutoring'
            onFormSubmit={(formValues) => {
              const pupil: User = new User(formValues);
              return db.collection('users').doc().set(pupil.toFirestore());
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
