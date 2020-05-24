import React from 'react';
import {
  useIntl,
  IntlShape,
  MessageDescriptor,
  defineMessages,
  FormattedMessage,
} from 'react-intl';
import { Grid, GridCell } from '@rmwc/grid';
import { Typography } from '@rmwc/typography';
import { TabBar, Tab } from '@rmwc/tabs';

import { TutoringForm, MentoringForm } from '@tutorbook/cta-forms';
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
  const [activeForm, setActiveForm] = React.useState<0 | 1>(0);
  const hidden: Record<string, string> = { display: 'none' };
  return (
    <div className={styles.heroFormWrapper}>
      <div className={styles.heroFormInnerWrapper}>
        <div className={styles.heroFormCard}>
          <TabBar
            className={styles.tabs}
            activeTabIndex={activeForm}
            onActivate={(evt) => setActiveForm(evt.detail.index as 0 | 1)}
          >
            <Tab className={styles.tab}>
              <FormattedMessage
                id='hero-form.tabs.mentors'
                defaultMessage='Expert mentors'
                description='Title for the mentors tab of the hero form.'
              />
            </Tab>
            <Tab className={styles.tab}>
              <FormattedMessage
                id='hero-form.tabs.tutors'
                defaultMessage='Free tutors'
                description='Title for the tutors tab of the hero form.'
              />
            </Tab>
          </TabBar>
          <MentoringForm style={activeForm !== 0 ? hidden : {}} horizontal />
          <TutoringForm style={activeForm !== 1 ? hidden : {}} horizontal />
          <div className={styles.titleBackground}>
            <Typography className={styles.title} use='headline2'>
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
