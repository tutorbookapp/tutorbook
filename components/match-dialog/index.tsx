import { Dialog } from '@rmwc/dialog';
import { useState } from 'react';

import { NavContext } from 'components/dialog/context';

import MatchDialogContent, { MatchDialogContentProps } from './content';
import styles from './dialog.module.scss';

export type MatchDialogProps = Omit<MatchDialogContentProps, 'setOpen'> & {
  onClosed: () => void;
};

export default function MatchDialog({
  onClosed,
  ...props
}: MatchDialogProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <Dialog
      data-cy='match-dialog'
      className={styles.dialog}
      open={open}
      onClosed={onClosed}
    >
      <NavContext.Provider value={() => setOpen(false)}>
        <MatchDialogContent {...props} />
      </NavContext.Provider>
    </Dialog>
  );
}
