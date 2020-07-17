import { useIntl, IntlShape, Msg, IntlHelper, Message } from 'lib/intl';

import React from 'react';
import SpotlightMsg from 'components/spotlight-msg';

import VolunteerRegisters from './gifs/volunteer-registers.gif';
import OrgVetsVolunteer from './gifs/org-vets-volunteer.gif';
import StudentRequests from './gifs/student-requests.gif';
import VolunteerEmails from './gifs/volunteer-emails.gif';

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
          label={msg(msgs.stepOne)}
          headline={msg(msgs.volunteerTitle)}
          body={msg(msgs.volunteerBody)}
          img={VolunteerRegisters}
          cta={{
            label: msg(msgs.volunteerCTA),
            href: '/signup',
          }}
          flipped
        />
        <SpotlightMsg
          label={msg(msgs.stepTwo)}
          headline={msg(msgs.orgTitle)}
          body={msg(msgs.orgBody)}
          img={OrgVetsVolunteer}
          cta={{
            label: msg(msgs.learnMoreCTA),
            href: 'https://github.com/tutorbookapp/tutorbook/issues/75',
          }}
          gray
        />
        <SpotlightMsg
          label={msg(msgs.stepThree)}
          headline={msg(msgs.studentTitle)}
          body={msg(msgs.studentBody)}
          img={StudentRequests}
          cta={{
            label: msg(msgs.studentCTA),
            href: '/search',
          }}
          flipped
        />
        <SpotlightMsg
          label={msg(msgs.stepFour)}
          headline={msg(msgs.emailTitle)}
          body={msg(msgs.emailBody)}
          img={VolunteerEmails}
          cta={{
            label: msg(msgs.learnMoreCTA),
            href: 'https://github.com/tutorbookapp/tutorbook/issues/82',
          }}
          gray
        />
      </div>
    </>
  );
}
