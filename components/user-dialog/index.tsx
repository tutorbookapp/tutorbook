import { Dialog } from '@rmwc/dialog';
import { useState } from 'react';

import { NavContext } from 'components/dialog/context';

import UserDialogContent, { UserDialogContentProps } from './content';
import styles from './dialog.module.scss';

export { Page } from './content';
export type UserDialogProps = Omit<UserDialogContentProps, 'closeDialog'> & {
  onClosed: () => void;
};

export default function UserDialog({
  onClosed,
  ...props
}: UserDialogProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <Dialog
      className={styles.dialog}
      data-cy='user-dialog'
      open={open}
      onClosed={onClosed}
    >
      <NavContext.Provider value={() => setOpen(false)}>
        <UserDialogContent closeDialog={() => setOpen(false)} {...props} />
      </NavContext.Provider>
    </Dialog>
  );
}
