import React from 'react';
import Router from 'next/router';
import { useIntl, IntlShape } from 'react-intl';
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
  const intl: IntlShape = useIntl();
  const [grade, setGrade] = React.useState<GradeAlias | undefined>();
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <Form
            inputs={[
              {
                label: intl.formatMessage({ id: 'form.grade' }),
                el: 'select' as InputElAlias,
                options: GRADES,
                onChange: (event: React.FormEvent<HTMLSelectElement>) => {
                  const gradeString: string = event.currentTarget.value;
                  setGrade(new Number(gradeString).valueOf() as GradeAlias);
                },
              },
              {
                label: intl.formatMessage({ id: 'form.searches' }),
                el: 'subjectselect' as InputElAlias,
                required: true,
                key: 'searches',
                grade,
              },
              {
                label: intl.formatMessage({ id: 'form.availability' }),
                el: 'scheduleinput' as InputElAlias,
                required: true,
                key: 'availability',
              },
            ]}
            submitLabel={intl.formatMessage({ id: 'pupil-form.submit' })}
            onFormSubmit={async (formValues) => {
              const pupil: User = new User({ ...formValues, grade });
              Router.push(`/${intl.locale}${pupil.searchURL}`);
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
