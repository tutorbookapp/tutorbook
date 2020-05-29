import { useIntl, defMsg, IntlShape, Msg, Message } from '@tutorbook/intl';
import { Query } from '@tutorbook/model';

import SpotlightMsg from '@tutorbook/spotlight-msg';
import QueryForm from '@tutorbook/query-form';
import Title from '@tutorbook/title';

import ParentApproves from './gifs/parent-approves.gif';
import PupilSignsUp from './gifs/pupil-signs-up.gif';
import TutorSignsUp from './gifs/tutor-signs-up.gif';
import TutorJoinsBramble from './gifs/tutor-joins-bramble.gif';

import msgs from './msgs';
import styles from './hero.module.scss';

export default function Hero({ query }: { query: Query }): JSX.Element {
  const intl: IntlShape = useIntl();

  function CTA(): JSX.Element {
    return (
      <div className={styles.hero}>
        <div className={styles.wrapper}>
          <div className={styles.title}>
            <Title>{intl.formatMessage(msgs[query.aspect])}</Title>
          </div>
          <QueryForm query={query} />
        </div>
      </div>
    );
  }

  return (
    <>
      <CTA />
      <div className={styles.summary}>
        <div className={styles.wrapper}>
          <h2 className={styles.subheader}>What is TB?</h2>
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
                "collaborate on meaningful (summer) projects that they're both " +
                'passionate about (e.g. writing a research paper or releasing ' +
                'a music album together).'
              }
            />
          </p>
          <p className={styles.body}>
            <Message
              id='hero-about.third-paragraph'
              defaultMessage={
                "We're also making sure that no one loses out on education " +
                'amidst COVID-19 by connecting K-12 students with free, ' +
                'volunteer tutors.'
              }
            />
          </p>
        </div>
      </div>
      <div className={styles.howItWorks}>
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
          gray
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
          gray
        />
      </div>
      <CTA />
    </>
  );
}
