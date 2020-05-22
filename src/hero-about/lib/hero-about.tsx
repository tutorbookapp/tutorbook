import React from 'react';

import {
  useIntl,
  IntlShape,
  MessageDescriptor,
  defineMessages,
  FormattedMessage,
} from 'react-intl';
import { Grid, GridCell } from '@rmwc/grid';
import { Card, CardMedia, CardPrimaryAction } from '@rmwc/card';
import { Typography } from '@rmwc/typography';
import { Link } from '@tutorbook/intl';

import Banner from '@tutorbook/banner';

import AtHomeImage from './jpgs/in-home-tutoring.jpg';
import WritingImage from './jpgs/writing.jpg';

import styles from './hero-about.module.scss';

const msgs: Record<string, MessageDescriptor> = defineMessages({
  mentorHeader: {
    id: 'hero-about.mentor.header',
    defaultMessage: 'Project oriented mentorship',
  },
  mentorBody: {
    id: 'hero-about.mentor.body',
    //defaultMessage: 'Become or connect with an expert mentor to do meaningful work.',
    defaultMessage:
      'Become an expert mentor and collaborate on meaningful work.',
  },
  tutorHeader: {
    id: 'hero-about.tutor.header',
    defaultMessage: 'COVID-19 free tutoring',
  },
  tutorBody: {
    id: 'hero-about.tutor.body',
    defaultMessage: 'Find or become a free, one-on-one, volunteer tutor.',
  },
});

interface FeatureCardProps {
  readonly header: string;
  readonly body: string;
  readonly href: string;
  readonly img: string;
}

function FeatureCard(props: FeatureCardProps): JSX.Element {
  return (
    <Card className={styles.card}>
      <Link href={props.href}>
        <CardPrimaryAction>
          <CardMedia
            sixteenByNine
            style={{ backgroundImage: `url(${props.img})` }}
          />
          <div className={styles.cardContent}>
            <Typography use='headline6'>{props.header}</Typography>
            <Typography use='body1'>{props.body}</Typography>
          </div>
        </CardPrimaryAction>
      </Link>
    </Card>
  );
}

export default function HeroAbout(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <Typography use='headline2'>
          <FormattedMessage id='hero-about.header' defaultMessage='About us' />
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
              'passionate about (e.g. writing a research paper together or ' +
              'releasing a music album together).'
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
        <Banner>
          <Typography use='headline4'>
            <FormattedMessage
              id='hero-about.banner-header'
              defaultMessage='Learn more'
            />
          </Typography>
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
        </Banner>
      </div>
    </div>
  );
}
