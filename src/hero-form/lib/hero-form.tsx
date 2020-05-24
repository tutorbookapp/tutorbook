import React from 'react';
import {
  useIntl,
  IntlShape,
  MessageDescriptor,
  defineMessages,
} from 'react-intl';
import { Grid, GridCell } from '@rmwc/grid';
import { Typography } from '@rmwc/typography';

import { TutoringForm } from '@tutorbook/cta-forms';
import FeatureCard from '@tutorbook/feature-card';

import AtHomeImage from './jpgs/in-home-tutoring.jpg';
import WritingImage from './jpgs/writing.jpg';

import styles from './hero-form.module.scss';

const msgs: Record<string, MessageDescriptor> = defineMessages({
  mentorHeader: {
    id: 'hero.mentor.header',
    defaultMessage: 'Project oriented mentorship',
  },
  mentorBody: {
    id: 'hero.mentor.body',
    //defaultMessage: 'Become or connect with an expert mentor to do meaningful work.',
    defaultMessage:
      'Become an expert mentor and collaborate on meaningful work.',
  },
  tutorHeader: {
    id: 'hero.tutor.header',
    defaultMessage: 'COVID-19 free tutoring',
  },
  tutorBody: {
    id: 'hero.tutor.body',
    defaultMessage: 'Find or become a free, one-on-one, volunteer tutor.',
  },
});

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
    <div className={styles.heroFormWrapper}>
      <div className={styles.heroFormInnerWrapper}>
        <div className={styles.heroFormCard}>
          <div className={styles.titleBackground}>
            <Typography className={styles.title} use='headline2'>
              Learn from and work with an expert.
            </Typography>
          </div>
          <div className={styles.formWrapper}>
            <TutoringForm horizontal />
          </div>
          <Grid className={styles.grid}>
            <GridCell desktop={6} tablet={4} phone={4}>
              <FeatureCard
                href='/volunteers'
                header={intl.formatMessage(msgs.mentorHeader)}
                body={intl.formatMessage(msgs.mentorBody)}
                img={AtHomeImage}
              />
            </GridCell>
            <GridCell desktop={6} tablet={4} phone={4}>
              <FeatureCard
                href='/parents'
                header={intl.formatMessage(msgs.tutorHeader)}
                body={intl.formatMessage(msgs.tutorBody)}
                img={WritingImage}
              />
            </GridCell>
          </Grid>
        </div>
      </div>
    </div>
  );
}
