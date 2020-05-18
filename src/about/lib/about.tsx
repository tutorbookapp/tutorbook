import React from 'react';
import Banner from '@tutorbook/banner';
import CTABlock from '@tutorbook/cta-block';
import SpotlightMsg from '@tutorbook/spotlight-msg';
import { Link } from '@tutorbook/intl';
import { Typography } from '@rmwc/typography';
import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
  FormattedMessage,
} from 'react-intl';

import ParentApproves from './gifs/parent-approves.gif';
import PupilSignsUp from './gifs/pupil-signs-up.gif';
import TutorSignsUp from './gifs/tutor-signs-up.gif';
import TutorJoinsBramble from './gifs/tutor-joins-bramble.gif';

import styles from './about.module.scss';

const msgs: Record<string, MessageDescriptor> = defineMessages({
  stepZero: {
    id: 'about.how-it-works.step-zero',
    defaultMessage: 'Step #0',
  },
  tutorTitle: {
    id: 'about.how-it-works.tutor.title',
    defaultMessage: 'Volunteer registers',
  },
  tutorBody: {
    id: 'about.how-it-works.tutor.body',
    defaultMessage:
      'The volunteer tutor (or mentor) signs up and creates their profile.',
  },
  tutorCTA: {
    id: 'about.how-it-works.tutor.cta',
    defaultMessage: 'Get started as a volunteer',
    description: 'Label for the CTA link to the tutor sign-up page.',
  },
  stepOne: {
    id: 'about.how-it-works.step-one',
    defaultMessage: 'Step #1',
  },
  pupilTitle: {
    id: 'about.how-it-works.pupil.title',
    defaultMessage: 'Student requests a volunteer',
  },
  pupilBody: {
    id: 'about.how-it-works.pupil.body',
    defaultMessage:
      'The student signs up, searches, and requests a tutor (or mentor).',
  },
  pupilCTA: {
    id: 'about.how-it-works.pupil.cta',
    defaultMessage: 'Get started as a student',
    description: 'Label for the CTA link to the student sign-up page.',
  },
  stepTwo: {
    id: 'about.how-it-works.step-two',
    defaultMessage: 'Step #2',
  },
  parentTitle: {
    id: 'about.how-it-works.parent.title',
    defaultMessage: 'Parent approves of the volunteer',
  },
  parentBody: {
    id: 'about.how-it-works.parent.body',
    defaultMessage:
      'Each request must receive parental approval before the student can ' +
      'meet with their tutor (or mentor).',
  },
  stepThree: {
    id: 'about.how-it-works.step-three',
    defaultMessage: 'Step #3',
  },
  brambleTitle: {
    id: 'about.how-it-works.bramble.title',
    defaultMessage: 'Virtual tutoring lessons via Bramble',
  },
  brambleBody: {
    id: 'about.how-it-works.bramble.body',
    defaultMessage:
      'After parental approval, the tutor and the student both receive a link' +
      ' to their secure, private Bramble room.',
  },
  learnMore: {
    id: 'about.how-it-works.learn-more',
    defaultMessage: 'Learn more',
    description: 'Label for the "Learn more" CTA links.',
  },
});

export default function About(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <div className={styles.aboutWrapper}>
      <div className={styles.aboutContent}>
        <Typography use='headline1'>
          <FormattedMessage
            id='about.about-us.title'
            description='The title of the "About us" home page section.'
            defaultMessage='About us'
          />
        </Typography>
        <Typography use='body1'>
          <FormattedMessage
            id='about.about-us.first-paragraph'
            description='The first paragraph of our "About us" description.'
            defaultMessage={
              '<b>Tutorbook is a free, online tutoring platform</b> that ' +
              'connects students affected by school closures with volunteer ' +
              'tutors.'
            }
            values={{ b: (...chunks: React.ReactElement[]) => <b>{chunks}</b> }}
          />
        </Typography>
        <Typography use='body1'>
          <FormattedMessage
            id='about.about-us.second-paragraph'
            description='The second paragraph of our "About us" description.'
            defaultMessage={
              'Our mission is to connect students with expertise through ' +
              'one-on-one mentoring and tutoring. Here’s how you can help:'
            }
          />
        </Typography>
        <ul style={{ listStyle: 'decimal' }}>
          <li>
            <FormattedMessage
              id='about.about-us.first-cta'
              description='The first CTA in the "About us" bulleted list.'
              defaultMessage={
                'Inform every parent and high school student that you know!'
              }
            />
          </li>
          <li>
            <FormattedMessage
              id='about.about-us.second-cta'
              description='The second CTA in the "About us" bulleted list.'
              defaultMessage={
                'Re-post this message and promote us so we can help more ' +
                'students!'
              }
            />
          </li>
          <li>
            <FormattedMessage
              id='about.about-us.third-cta'
              description='The third CTA in the "About us" bulleted list.'
              defaultMessage={
                'Help us recruit more volunteers by following #2 and by ' +
                'signing up <a>here</a>.'
              }
              values={{
                a: (...chunks: React.ReactElement[]) => (
                  <Link href='/tutors'>
                    <a>
                      <b>{chunks}</b>
                    </a>
                  </Link>
                ),
              }}
            />
          </li>
        </ul>
        <Banner>
          <Typography use='headline4'>
            <FormattedMessage
              id='about.our-mission.title'
              description='The title of the "Our mission" home page section.'
              defaultMessage='Our mission & vision'
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='about.our-mission.first-paragraph'
              description='The first paragraph of the "Our mission" section.'
              defaultMessage={
                'Students across the globe no longer have individualized ' +
                'support from teachers nor in-person collaboration due to ' +
                'COVID-19.'
              }
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='about.our-mission.second-paragraph'
              description='The second paragraph of the "Our mission" section.'
              defaultMessage={
                'Our vision is for every student to have an expert mentor and' +
                ' (as needed) tutor(s).'
              }
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='about.our-mission.third-paragraph'
              description='The third paragraph of the "Our mission" section.'
              defaultMessage={
                'To do this, we have reached out to university students and ' +
                'educators from around the world—people who want to make a ' +
                'difference in this time of need.'
              }
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='about.our-mission.fourth-paragraph'
              description='The fourth paragraph of the "Our mission" section.'
              defaultMessage={
                'As a result of the kindness and generosity of these talented' +
                ' individuals, students now have access to free one-on-one ' +
                'academic mentorship through our platform (and highly ' +
                'talented individuals have a means to make a difference from ' +
                'home 😉).'
              }
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='about.our-mission.cta'
              description='The "volunteer here" CTA link.'
              defaultMessage={'Want to help out? Volunteer <a>here</a>.'}
              values={{
                a: (...chunks: React.ReactElement[]) => (
                  <Link href='/tutors'>
                    <a>{chunks}</a>
                  </Link>
                ),
              }}
            />
          </Typography>
        </Banner>
        <Typography className={styles.header} use='headline1'>
          <FormattedMessage
            id='about.how-it-works.title'
            description='The title of the "How it works" section.'
            defaultMessage='How it works'
          />
        </Typography>
      </div>
      <SpotlightMsg
        label={intl.formatMessage(msgs.stepZero)}
        headline={intl.formatMessage(msgs.tutorTitle)}
        body={intl.formatMessage(msgs.tutorBody)}
        img={TutorSignsUp}
        cta={{
          label: intl.formatMessage(msgs.tutorCTA),
          href: '/tutors',
        }}
        flipped
        tan
      />
      <SpotlightMsg
        label={intl.formatMessage(msgs.stepOne)}
        headline={intl.formatMessage(msgs.pupilTitle)}
        body={intl.formatMessage(msgs.pupilBody)}
        img={PupilSignsUp}
        cta={{
          label: intl.formatMessage(msgs.pupilCTA),
          href: '/pupils',
        }}
      />
      <SpotlightMsg
        label={intl.formatMessage(msgs.stepTwo)}
        headline={intl.formatMessage(msgs.parentTitle)}
        body={intl.formatMessage(msgs.parentBody)}
        img={ParentApproves}
        cta={{
          label: intl.formatMessage(msgs.learnMore),
          href: 'https://intercom.help/tutorbook/',
        }}
        flipped
        tan
      />
      <SpotlightMsg
        label={intl.formatMessage(msgs.stepThree)}
        headline={intl.formatMessage(msgs.brambleTitle)}
        body={intl.formatMessage(msgs.brambleBody)}
        img={TutorJoinsBramble}
        cta={{
          label: intl.formatMessage(msgs.learnMore),
          href: 'https://about.bramble.io/',
        }}
      />
      <CTABlock />
    </div>
  );
}
