import React from 'react';

import { useIntl, IntlShape, FormattedMessage } from 'react-intl';
import { Typography } from '@rmwc/typography';

import Banner from '@tutorbook/banner';
import CTALink from '@tutorbook/cta-link';
import CTABlock from '@tutorbook/cta-block';
import SpotlightMsg from '@tutorbook/spotlight-msg';

import ParentApproves from '@tutorbook/about/gifs/parent-approves.gif';
import PupilSignsUp from '@tutorbook/about/gifs/pupil-signs-up.gif';
import TutorSignsUp from '@tutorbook/about/gifs/tutor-signs-up.gif';
import TutorJoinsBramble from '@tutorbook/about/gifs/tutor-joins-bramble.gif';

import msgs from '@tutorbook/about/lib/msgs';
import styles from './hero-about.module.scss';

export default function HeroAbout(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <>
      <Banner>
        <div className={styles.wrapper}>
          <div className={styles.content}>
            <Typography use='headline2'>
              <FormattedMessage
                id='hero-about.header'
                defaultMessage='About us'
              />
            </Typography>
            <Typography use='body1'>
              <b>
                <FormattedMessage
                  id='hero-about.first-paragraph'
                  defaultMessage={
                    'Tutorbook is a free, online platform that connects students ' +
                    'with expert mentors and volunteer tutors.'
                  }
                />
              </b>
            </Typography>
            <Typography use='body1'>
              <FormattedMessage
                id='hero-about.second-paragraph'
                defaultMessage={
                  "We're connecting 9-12 students with expert mentors to " +
                  "collaborate on meaningful (summer) projects that they're both " +
                  'passionate about (e.g. writing a research paper or releasing ' +
                  'a music album together).'
                }
              />
            </Typography>
            <Typography use='body1'>
              <FormattedMessage
                id='hero-about.third-paragraph'
                defaultMessage={
                  "We're also making sure that no one loses out on education " +
                  'amidst COVID-19 by connecting K-12 students with free, ' +
                  'volunteer tutors.'
                }
              />
            </Typography>
            <CTALink
              label={intl.formatMessage({ id: 'learn-more' })}
              href='/parents'
            />
          </div>
        </div>
      </Banner>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <Typography className={styles.header} use='headline1'>
            <FormattedMessage
              id='about.how-it-works.title'
              description='The title of the "How it works" section.'
              defaultMessage='How it works'
            />
          </Typography>
        </div>
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
    </>
  );
}
