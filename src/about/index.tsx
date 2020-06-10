import { useIntl, IntlShape, Msg, IntlHelper, Message } from '@tutorbook/intl';

import React from 'react';
import SpotlightMsg from '@tutorbook/spotlight-msg';

import ParentApproves from './gifs/parent-approves.gif';
import PupilSignsUp from './gifs/pupil-signs-up.gif';
import TutorSignsUp from './gifs/tutor-signs-up.gif';
import TutorJoinsBramble from './gifs/tutor-joins-bramble.gif';

import msgs from './msgs';
import styles from './about.module.scss';

export default function About(): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  return (
    <>
      <div className={styles.summary}>
        <div className={styles.wrapper}>
          <h2 className={styles.subheader}>What is Tutorbook?</h2>
          <p className={styles.body}>
            <b className={styles.bold}>
              <Message
                id='hero-about.first-paragraph'
                defaultMessage={
                  'Tutorbook is a free, online platform that connects students ' +
                  'with expert mentors and volunteer tutors.'
                }
              />
            </b>
          </p>
          <p className={styles.body}>
            <Message
              id='hero-about.second-paragraph'
              defaultMessage={
                "We're connecting 9-12 students with expert mentors to " +
                "collaborate on projects they're both " +
                'passionate about (e.g. writing a research paper or releasing ' +
                'a music album together).'
              }
            />
          </p>
          <p className={styles.body}>
            <Message
              id='hero-about.third-paragraph'
              defaultMessage={
                "We're also connecting K-12 students with free, " +
                'volunteer tutors to make sure that no one loses out on ' +
                'education amidst COVID-19.'
              }
            />
          </p>
        </div>
      </div>
      <div className={styles.howItWorks}>
        <SpotlightMsg
          label={msg(msgs.stepZero)}
          headline={msg(msgs.tutorTitle)}
          body={msg(msgs.tutorBody)}
          img={TutorSignsUp}
          cta={{
            label: msg(msgs.tutorCTA),
            href: '/signup',
          }}
          flipped
        />
        <SpotlightMsg
          label={msg(msgs.stepOne)}
          headline={msg(msgs.pupilTitle)}
          body={msg(msgs.pupilBody)}
          img={PupilSignsUp}
          cta={{
            label: msg(msgs.pupilCTA),
            href: '/search',
          }}
          gray
        />
        <SpotlightMsg
          label={msg(msgs.stepTwo)}
          headline={msg(msgs.parentTitle)}
          body={msg(msgs.parentBody)}
          img={ParentApproves}
          cta={{
            label: msg(msgs.learnMore),
            href: 'https://intercom.help/tutorbook/',
          }}
          flipped
        />
        <SpotlightMsg
          label={msg(msgs.stepThree)}
          headline={msg(msgs.brambleTitle)}
          body={msg(msgs.brambleBody)}
          img={TutorJoinsBramble}
          cta={{
            label: msg(msgs.learnMore),
            href: 'https://about.bramble.io/',
          }}
          gray
        />
      </div>
    </>
  );
}
