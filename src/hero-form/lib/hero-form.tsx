import React from 'react';
import { useIntl, IntlShape, FormattedMessage } from 'react-intl';
import { Typography } from '@rmwc/typography';

import CTAForm from '@tutorbook/cta-form';
import Checkmarks from '@tutorbook/checkmarks';

import styles from './hero-form.module.scss';

/**
 * React component that emulates AirBNB's landing page form and collects the
 * following information from pupils (and creates their Firestore user document
 * along the way).
 * - Optional: (grade) Your grade level
 * - (searches) What would you like to learn?
 * - (availability) When are you available?
 */
export default function HeroForm(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <div className={styles.heroFormCard}>
            <Typography className={styles.heroFormTitle} use='headline4'>
              <FormattedMessage
                id='hero-form.title'
                defaultMessage='Connect with expert mentors and tutors'
                description={
                  'The first thing that the user sees; the title to the hero ' +
                  'form on our landing page calling them to "Connect with ' +
                  'expert mentors and tutors".'
                }
              />
            </Typography>
            <CTAForm />
            <Checkmarks
              labels={[
                intl.formatMessage({ id: 'cta-block.safeguarding' }),
                intl.formatMessage({ id: 'cta-block.lesson-recordings' }),
              ]}
              white
            />
          </div>
        </div>
      </div>
      <div className={styles.heroBackground} />
    </>
  );
}
