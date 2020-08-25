import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@rmwc/card';
import { animated, useSpring } from 'react-spring';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import Inputs from 'components/inputs/user';
import Loader from 'components/loader';
import Title from 'components/title';

import { signup } from 'lib/account/signup';
import { Aspect, User, OrgJSON } from 'lib/model';
import { useUser } from 'lib/account';

import styles from './signup.module.scss';

interface SignupProps {
  aspect: Aspect;
  org: OrgJSON;
}

/**
 * Wrapper for the two distinct volunteer sign-up forms:
 * 0. The mentor sign-up form where experts (e.g. grad students, professionals)
 * tell us what they're working on so we can match them up with students who are
 * interested in working on the same thing.
 * 1. The volunteer tutor sign-up form where altruistic individuals can sign-up
 * to help tutor somebody affected by COVID-19.
 */
export default function Signup({ aspect, org }: SignupProps): JSX.Element {
  const { t, lang: locale } = useTranslation();
  const { user, updateUser } = useUser();

  useEffect(() => {
    void updateUser((prev: User) => {
      const orgs = new Set(prev.orgs);
      orgs.add(org.id);
      return new User({ ...prev, orgs: [...orgs] });
    });
  }, [updateUser, org.id]);

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

  const mentorsHProps = useSpring({
    transform: `translateY(-${aspect === 'mentoring' ? 0 : 100}%)`,
  });
  const mentorsBProps = useSpring({
    transform: `translateY(-${aspect === 'mentoring' ? 0 : 100}%)`,
  });
  const tutorsHProps = useSpring({
    transform: `translateY(${aspect === 'tutoring' ? 0 : 100}%)`,
  });
  const tutorsBProps = useSpring({
    transform: `translateY(${aspect === 'tutoring' ? 0 : 100}%)`,
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <animated.div style={mentorsHProps}>
          <Title>{(org.signup[locale].mentoring || {}).header || ''}</Title>
        </animated.div>
        <animated.div style={tutorsHProps}>
          <Title>{(org.signup[locale].tutoring || {}).header || ''}</Title>
        </animated.div>
      </div>
      <div className={styles.description}>
        <animated.div style={mentorsBProps}>
          {(org.signup[locale].mentoring || {}).body || ''}
        </animated.div>
        <animated.div style={tutorsBProps}>
          {(org.signup[locale].tutoring || {}).body || ''}
        </animated.div>
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
