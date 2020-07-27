import { ResizeObserver } from '@juggle/resize-observer';
import { Aspect } from 'lib/model';

import React, { useMemo } from 'react';
import Title from 'components/title';
import VolunteerForm from 'components/volunteer-form';

import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import styles from './volunteer-page.module.scss';

interface VolunteerPageProps {
  aspect: Aspect;
  org?: string;
}

/**
 * Wrapper for the two distinct volunteer sign-up forms:
 * 0. The mentor sign-up form where experts (e.g. grad students, professionals)
 * tell us what they're working on so we can match them up with students who are
 * interested in working on the same thing.
 * 1. The volunteer tutor sign-up form where altruistic individuals can sign-up
 * to help tutor somebody affected by COVID-19.
 */
export default function VolunteerPage({
  aspect,
  org,
}: VolunteerPageProps): JSX.Element {
  const [headerRef, { height: headerHeight }] = useMeasure({
    polyfill: ResizeObserver,
  });
  const [descRef, { height: descHeight }] = useMeasure({
    polyfill: ResizeObserver,
  });

  const headerStyle: Record<string, string> = useMemo(() => {
    const height: string = headerHeight ? `${headerHeight}px` : '125px';
    const transform: string =
      aspect === 'mentoring'
        ? `translateY(-${height})`
        : `translateY(${height})`;
    return { transform };
  }, [aspect, headerHeight]);
  const descStyle: Record<string, string> = useMemo(() => {
    const height: string = descHeight ? `${descHeight}px` : '84px';
    const transform: string =
      aspect === 'mentoring'
        ? `translateY(-${height})`
        : `translateY(${height})`;
    return { transform };
  }, [aspect, descHeight]);

  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header} ref={headerRef}>
        <span style={aspect === 'mentoring' ? {} : headerStyle}>
          <Title>{t('signup-page:mentoring-header')}</Title>
        </span>
        <span style={aspect === 'tutoring' ? {} : headerStyle}>
          <Title>{t('signup-page:tutoring-header')}</Title>
        </span>
      </div>
      <div className={styles.description} ref={descRef}>
        <span style={aspect === 'mentoring' ? {} : descStyle}>
          {t('signup-page:mentoring-body')}
        </span>
        <span style={aspect === 'tutoring' ? {} : descStyle}>
          {t('signup-page:tutoring-body')}
        </span>
      </div>
      <VolunteerForm aspect={aspect} org={org} />
    </div>
  );
}
