import React from 'react';
import Router from 'next/router';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { GRADES, GradeAlias, User } from '@tutorbook/model';

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
  const [grade, setGrade] = React.useState<GradeAlias | undefined>();
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <Form
            inputs={[
              {
                label: 'Your grade level',
                el: 'select' as InputElAlias,
                options: GRADES,
                onChange: (event: React.FormEvent<HTMLSelectElement>) => {
                  const gradeString: string = event.currentTarget.value;
                  setGrade(new Number(gradeString).valueOf() as GradeAlias);
                },
              },
              {
                label: 'What would you like to learn?',
                el: 'subjectselect' as InputElAlias,
                required: true,
                key: 'searches',
                grade,
              },
              {
                label: 'When are you available?',
                el: 'scheduleinput' as InputElAlias,
                required: true,
                key: 'availability',
              },
            ]}
            submitLabel='Search volunteer tutors'
            onFormSubmit={async (formValues) => {
              const pupil: User = new User({ ...formValues, grade });
              Router.push(pupil.searchURL);
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
