import { useUser } from 'lib/account';
import { signup } from 'lib/account/signup';
import { Card } from '@rmwc/card';
import { User, UserJSON, Aspect } from 'lib/model';

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  FormEvent,
} from 'react';
import Loader from 'components/loader';
import Button from 'components/button';

import useTranslation from 'next-translate/useTranslation';

import Inputs from './inputs';
import styles from './volunteer-form.module.scss';

interface VolunteerFormProps {
  aspect: Aspect;
  org?: string;
}

export default function VolunteerForm({
  aspect,
  org,
}: VolunteerFormProps): JSX.Element {
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

  useEffect(() => {
    if (!org) return;
    const { orgs, ...rest } = user;
    const idx: number = orgs.indexOf(org);
    if (idx < 0) {
      void updateUser(new User({ ...rest, orgs: [...orgs, org] }));
    } else {
      const updated = [...orgs.slice(0, idx), org, ...orgs.slice(idx + 1)];
      void updateUser(new User({ ...rest, orgs: updated }));
    }
  }, [org, user, updateUser]);

  return (
    <Card className={styles.formCard}>
      <Loader active={submitting || submitted} checked={submitted} />
      <form className={styles.form} onSubmit={handleSubmit}>
        <Inputs
          aspect={aspect}
          value={user.toJSON()}
          onChange={(json: UserJSON) => updateUser(User.fromJSON(json))}
        />
        {!user.id && (
          <Button
            className={styles.formSubmitButton}
            label={t(
              user.id
                ? 'signup:submit-update-btn'
                : `signup:submit-${aspect}-btn`
            )}
            disabled={submitting || submitted}
            raised
            arrow
          />
        )}
      </form>
    </Card>
  );
}
