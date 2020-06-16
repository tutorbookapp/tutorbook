import { Dialog } from '@rmwc/dialog';

import React from 'react';

import styles from './create-user-dialog.module.scss';

interface CreateUserDialogProps {
  onClosed: () => void;
}

export default function CreateUserDialog({
  onClosed,
}: CreateUserDialogProps): JSX.Element {
  return (
    <Dialog open onClosed={onClosed}>
      <div className={styles.content}>
        <h1 className={styles.header}>Create User</h1>
        <p className={styles.body}>
          To create a new user, open an Incognito window and go to your unique
          sign-up link. Then, fill out the user's profile and click "submit".
          Once you do, close that window and navigate back to this tab. You
          should see your newly created user in the "People" dashboard.
        </p>
      </div>
    </Dialog>
  );
}
