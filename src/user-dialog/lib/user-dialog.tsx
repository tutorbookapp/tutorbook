import React from 'react';
import Button from '@tutorbook/button';
import { User } from '@tutorbook/model';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@rmwc/dialog';

import styles from './user-dialog.module.scss';

interface UserDialogProps {
  readonly user: User;
}

export default class UserDialog extends React.Component<UserDialogProps> {
  public render(): JSX.Element {
    return (
      <Dialog open className={styles.dialog}>
        <DialogTitle>{this.props.user.name}</DialogTitle>
        <DialogContent>{this.props.user.bio}</DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button arrow>Request {this.props.user.firstName}</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
