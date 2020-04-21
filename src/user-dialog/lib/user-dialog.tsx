import React from 'react';
import Utils from '@tutorbook/covid-utils';
import Button from '@tutorbook/button';
import SubjectSelect from '@tutorbook/subject-select';
import TimeslotInput from '@tutorbook/timeslot-input';
import { UserContext } from '@tutorbook/next-firebase';
import { User, Timeslot, Appt } from '@tutorbook/model';
import { Avatar } from '@rmwc/avatar';
import { TextField } from '@rmwc/textfield';
import { Typography } from '@rmwc/typography';
import { Dialog, DialogProps } from '@rmwc/dialog';

import styles from './user-dialog.module.scss';

interface UserDialogState {
  readonly appt: Appt;
}

interface UserDialogProps extends DialogProps {
  readonly user: User;
  readonly appt?: Appt;
  readonly className?: string;
}

export default class UserDialog extends React.Component<UserDialogProps> {
  public readonly state: UserDialogState;
  public static readonly contextType: React.Context<User> = UserContext;

  public constructor(props: UserDialogProps) {
    super(props);
    this.state = {
      appt:
        props.appt ||
        new Appt({
          attendees: [
            {
              uid: props.user.uid,
              roles: ['tutor'],
            },
            {
              uid: this.context.uid,
              roles: ['pupil'],
            },
          ],
          subjects: Utils.intersection<string>(
            props.user.subjects.explicit,
            this.context.searches.explicit
          ),
          time: Utils.intersection<Timeslot>(
            props.user.availability,
            this.context.availability,
            (a, b) => a.equalTo(b)
          )[0],
        }),
    };
    this.handleSubjectsChange = this.handleSubjectsChange.bind(this);
    this.handleTimeslotChange = this.handleTimeslotChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
  }

  private handleSubjectsChange(subjects: string[]): void {
    this.setState({
      appt: new Appt({
        ...this.state.appt,
        subjects,
      }),
    });
  }

  private handleTimeslotChange(time: Timeslot): void {
    this.setState({
      appt: new Appt({
        ...this.state.appt,
        time,
      }),
    });
  }

  private handleMessageChange(event: React.FormEvent<HTMLInputElement>): void {
    this.setState({
      appt: new Appt({
        ...this.state.appt,
        message: event.currentTarget.value,
      }),
    });
  }

  /**
   * Renders the `UserDialog` that shows profile info and enables booking.
   * @todo Only show the profile's subjects in the `SubjectSelect`.
   */
  public render(): JSX.Element {
    const { user, className, ...rest } = this.props;
    return (
      <Dialog {...rest} open>
        <div className={styles.contentWrapper}>
          <div className={styles.leftSide}>
            <Avatar
              src='https://lh3.googleusercontent.com/-2ZeeLPx2zIA/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJOyaBH4I4ySxbkrdmPwTbRp7T4lOA.CMID/s83-c/photo.jpg'
              size='xlarge'
              name={user.name}
              className={styles.avatar}
            />
          </div>
          <div className={styles.rightSide}>
            <Typography className={styles.name} use='headline4'>
              {user.name}
            </Typography>
            <Typography className={styles.bio} use='body1'>
              {user.bio}
            </Typography>
            <form className={styles.form}>
              <SubjectSelect
                outlined
                required
                renderToPortal
                label='Subjects'
                className={styles.formField}
                onChange={this.handleSubjectsChange}
                val={this.state.appt.subjects}
              />
              <TimeslotInput
                outlined
                required
                label='Time'
                className={styles.formField}
                onChange={this.handleTimeslotChange}
                availability={user.availability}
                val={this.state.appt.time}
              />
              <TextField
                outlined
                textarea
                rows={4}
                label='Message'
                className={styles.formField}
                onChange={this.handleMessageChange}
                value={this.state.appt.message}
              />
              <Button className={styles.button} raised arrow>
                Request {user.firstName}
              </Button>
            </form>
          </div>
        </div>
      </Dialog>
    );
  }
}
