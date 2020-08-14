import React, { FormEvent, useCallback, useMemo, useState } from 'react';
import { Card } from '@rmwc/card';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import Inputs from 'components/inputs/user';
import Loader from 'components/loader';
import Title from 'components/title';

import { signup } from 'lib/account/signup';
import { Aspect } from 'lib/model';
import { useUser } from 'lib/account';

import styles from './signup.module.scss';

interface SignupProps {
  aspect: Aspect;
}

/**
 * Wrapper for the two distinct volunteer sign-up forms:
 * 0. The mentor sign-up form where experts (e.g. grad students, professionals)
 * tell us what they're working on so we can match them up with students who are
 * interested in working on the same thing.
 * 1. The volunteer tutor sign-up form where altruistic individuals can sign-up
 * to help tutor somebody affected by COVID-19.
 */
export default function Signup({ aspect }: SignupProps): JSX.Element {
  const [headerRef, { height: headerHeight }] = useMeasure({ polyfill });
  const [descRef, { height: descHeight }] = useMeasure({ polyfill });

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
  const { user, updateUser } = useUser();

  const [submittingMentor, setSubmittingMentor] = useState<boolean>(false);
  const [submittingTutor, setSubmittingTutor] = useState<boolean>(false);
  const [submittedMentor, setSubmittedMentor] = useState<boolean>(false);
  const [submittedTutor, setSubmittedTutor] = useState<boolean>(false);

  const submitting = useMemo(
    () => (aspect === 'mentoring' ? submittingMentor : submittingTutor),
    [aspect, submittingMentor, submittingTutor]
  );
  const submitted = useMemo(
    () => (aspect === 'mentoring' ? submittedMentor : submittedTutor),
    [aspect, submittedMentor, submittedTutor]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setSubmittingMentor((prev) => aspect === 'mentoring' || prev);
      setSubmittingTutor((prev) => aspect === 'tutoring' || prev);
      await signup(user);
      setSubmittedMentor((prev) => aspect === 'mentoring' || prev);
      setSubmittedTutor((prev) => aspect === 'tutoring' || prev);
      setSubmittingMentor((prev) => aspect === 'mentoring' && !prev);
      setSubmittingTutor((prev) => aspect === 'tutoring' && !prev);
      setTimeout(() => {
        setSubmittedMentor((prev) => aspect === 'mentoring' && !prev);
        setSubmittedTutor((prev) => aspect === 'tutoring' && !prev);
      }, 2000);
    },
    [aspect, user]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header} ref={headerRef}>
        <span style={aspect === 'mentoring' ? {} : headerStyle}>
          <Title>{t('signup:mentoring-header')}</Title>
        </span>
        <span style={aspect === 'tutoring' ? {} : headerStyle}>
          <Title>{t('signup:tutoring-header')}</Title>
        </span>
      </div>
      <div className={styles.description} ref={descRef}>
        <span style={aspect === 'mentoring' ? {} : descStyle}>
          {t('signup:mentoring-body')}
        </span>
        <span style={aspect === 'tutoring' ? {} : descStyle}>
          {t('signup:tutoring-body')}
        </span>
      </div>
      <Card className={styles.formCard}>
        <Loader active={submitting || submitted} checked={submitted} />
        <form className={styles.form} onSubmit={handleSubmit}>
          <Inputs
            thirdPerson
            value={user}
            onChange={updateUser}
            name
            email
            phone
            photo
            bio
            socials
            availability
            availabilityRequired
            langs
            mentoringSubjects={aspect === 'mentoring'}
            mentoringRequired={aspect === 'mentoring'}
            tutoringSubjects={aspect === 'tutoring'}
            tutoringRequired={aspect === 'tutoring'}
            className={styles.field}
          />
          {!user.id && (
            <Button
              className={styles.btn}
              label={t(
                user.id ? 'user3rd:update-btn' : `user3rd:${aspect}-btn`
              )}
              disabled={submitting || submitted}
              raised
              arrow
            />
          )}
        </form>
      </Card>
    </div>
  );
}
