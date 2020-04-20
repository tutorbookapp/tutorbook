import React from 'react';
import Link from 'next/link';
import Banner from '@tutorbook/banner';
import { Typography } from '@rmwc/typography';

import styles from './hero-about.module.scss';

export default function HeroAbout() {
  return (
    <div className={styles.aboutWrapper}>
      <div className={styles.aboutContent}>
        <Typography use='headline1'>About us</Typography>
        <Typography use='body1'>
          <b>Tutorbook is a free, online tutoring platform</b> that connects
          students affected by school closures with volunteer tutors.
        </Typography>
        <Typography use='body1'>
          In doing so, we are making universal, free, and online education a
          reality in this time of school crises. Here’s how you can help:
        </Typography>
        <ul style={{ listStyle: 'decimal' }}>
          <li>Inform every parent and high school student that you know!</li>
          <li>
            Re-post this message and promote us so we can help more students!
          </li>
          <li>
            Help us recruit more volunteers by following #2 and by signing up{' '}
            <Link href='/tutors'>
              <a>
                <b>here</b>
              </a>
            </Link>
            .
          </li>
        </ul>
        <Banner>
          <Typography use='headline2'>Our mission</Typography>
          <Typography use='body1'>
            Students across the globe no longer have face-to-face support from
            teachers or in-person collaboration due to COVID-19.
          </Typography>
          <Typography use='body1'>
            In response, we have reached out to university students and
            educators from around the world—people who want to make a difference
            but don’t know how.
          </Typography>
          <Typography use='body1'>
            As a result of the kindness and generosity of these talented
            individuals, students now have access to free one-on-one academic
            mentorship through our platform (and highly talented individuals
            have a means to make a difference from home 😉).
          </Typography>
          <Typography use='body1'>
            Want to help out? Volunteer{' '}
            <Link href='/tutors'>
              <a>here</a>
            </Link>
            .
          </Typography>
        </Banner>
      </div>
    </div>
  );
}
