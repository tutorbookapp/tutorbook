import React, { memo, useState, useEffect, useCallback } from 'react';
import Inputs from 'components/volunteer-form/inputs';
import Button from 'components/button';
import { responseInterface } from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { UserJSON } from 'lib/model';

import styles from './edit-page.module.scss';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface EditPageProps {
  value: UserJSON;
  openDisplay: () => void;
  mutate: responseInterface<UserJSON, Error>['mutate'];
}

export default memo(function EditPage({
  value,
  mutate,
  openDisplay,
}: EditPageProps): JSX.Element {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (submitting) setSubmitted(false);
  }, [submitting]);
  useEffect(() => {
    if (submitted) setSubmitting(false);
  }, [submitted]);

  const onSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await sleep(4000);
    setSubmitted(true);
    // Wait 2secs to show checkmark animation before hiding the loading overlay
    // and letting the user edit their newly created/updated user.
    setTimeout(() => setSubmitted(false), 2000);
  }, []);

  const { t } = useTranslation();

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Inputs value={value} onChange={mutate} />
      <Button
        onClick={openDisplay}
        className={styles.formSubmitButton}
        label={t(value.id ? 'signup:update-btn' : `signup:create-btn`)}
        disabled={submitting || submitted}
        raised
        arrow
      />
    </form>
  );
});
