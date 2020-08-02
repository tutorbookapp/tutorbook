import React, { useState } from 'react';
import UserDialog from 'components/user-dialog';
import useTranslation from 'next-translate/useTranslation';

import { Availability, Aspect, User } from 'lib/model';

import Inputs from './inputs';

import styles from './request-dialog.module.scss';

interface RequestDialogProps {
  onClosed: () => void;
  subjects: string[];
  times?: Availability;
  aspect: Aspect;
  user: User;
}

export default function RequestDialog({
  subjects: initialSubjects,
  times: initialTimes,
  onClosed,
  aspect,
  user,
}: RequestDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const { t } = useTranslation();

  return (
    <UserDialog
      onClosed={onClosed}
      loading={loading}
      checked={checked}
      user={user}
    >
      <h6 className={styles.header}>{t('common:request')}</h6>
      <Inputs
        initialSubjects={initialSubjects}
        initialTimes={initialTimes}
        setLoading={setLoading}
        setChecked={setChecked}
        aspect={aspect}
        user={user.toJSON()}
      />
    </UserDialog>
  );
}
