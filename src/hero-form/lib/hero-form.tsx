import React from 'react';
import CTAForm from '@tutorbook/cta-form';
import Checkmarks from '@tutorbook/checkmarks';

import styles from './hero-form.module.scss';

/**
 * React component that emulates AirBNB's landing page form and collects the
 * following information from pupils (and creates their Firestore user document
 * along the way).
 * - Optional: (grade) Your grade level
 * - (searches.explicit) What would you like to learn?
 * - (availability) When are you available?
 */
export default function HeroForm(): JSX.Element {
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <div className={styles.heroFormCard}>
            <CTAForm />
            <Checkmarks
              labels={['Safeguarding', 'Lesson recordings and more']}
              white
            />
          </div>
        </div>
      </div>
      <div className={styles.heroBackground} />
    </>
  );
}
