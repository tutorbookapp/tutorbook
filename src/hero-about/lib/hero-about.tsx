import React from 'react';
import Banner from '@tutorbook/banner';
import { Link } from '@tutorbook/intl';
import { Typography } from '@rmwc/typography';
import { FormattedMessage } from 'react-intl';

import styles from './hero-about.module.scss';

export default function HeroAbout() {
  return (
    <div className={styles.aboutWrapper}>
      <div className={styles.aboutContent}>
        <Typography use='headline2'>
          <FormattedMessage
            id='hero-about.about-us.title'
            description='The title of the "About us" home page section.'
            defaultMessage='About us'
          />
        </Typography>
        <Typography use='body1'>
          <FormattedMessage
            id='hero-about.about-us.first-paragraph'
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
            id='hero-about.about-us.second-paragraph'
            description='The second paragraph of our "About us" description.'
            defaultMessage={
              'In doing so, we are making universal, free, and online ' +
              'education a reality in this time of school crises. Here’s how ' +
              'you can help:'
            }
          />
        </Typography>
        <ul style={{ listStyle: 'decimal' }}>
          <li>
            <FormattedMessage
              id='hero-about.about-us.first-cta'
              description='The first CTA in the "About us" bulleted list.'
              defaultMessage={
                'Inform every parent and high school student that you know!'
              }
            />
          </li>
          <li>
            <FormattedMessage
              id='hero-about.about-us.second-cta'
              description='The second CTA in the "About us" bulleted list.'
              defaultMessage={
                'Re-post this message and promote us so we can help more ' +
                'students!'
              }
            />
          </li>
          <li>
            <FormattedMessage
              id='hero-about.about-us.third-cta'
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
          <Typography use='headline2'>
            <FormattedMessage
              id='hero-about.our-mission.title'
              description='The title of the "Our mission" home page section.'
              defaultMessage='Our mission'
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='hero-about.our-mission.first-paragraph'
              description='The first paragraph of the "Our mission" section.'
              defaultMessage={
                'Students across the globe no longer have face-to-face ' +
                'support from teachers or in-person collaboration due to ' +
                'COVID-19.'
              }
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='hero-about.our-mission.second-paragraph'
              description='The second paragraph of the "Our mission" section.'
              defaultMessage={
                'In response, we have reached out to university students and ' +
                'educators from around the world—people who want to make a ' +
                'difference but don’t know how.'
              }
            />
          </Typography>
          <Typography use='body1'>
            <FormattedMessage
              id='hero-about.our-mission.third-paragraph'
              description='The third paragraph of the "Our mission" section.'
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
              id='hero-about.our-mission.cta'
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
      </div>
    </div>
  );
}
