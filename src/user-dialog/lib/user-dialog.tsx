import React from 'react';
import Utils from '@tutorbook/covid-utils';
import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';
import AnimatedCheckmarkOverlay from '@tutorbook/animated-checkmark-overlay';
import { Link } from '@tutorbook/intl';
import { UserContext } from '@tutorbook/next-firebase';
import { ApiError, User, Timeslot, Appt } from '@tutorbook/model';
import { Avatar } from '@rmwc/avatar';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import { Typography } from '@rmwc/typography';
import { Dialog, DialogProps } from '@rmwc/dialog';
import { AxiosResponse, AxiosError } from 'axios';
import {
  injectIntl,
  defineMessages,
  IntlShape,
  FormattedMessage,
  MessageDescriptor,
} from 'react-intl';

import axios from 'axios';
import to from 'await-to-js';

import styles from './user-dialog.module.scss';

interface UserDialogState {
  readonly appt: Readonly<Appt>;
  readonly submitting: boolean;
  readonly submitted: boolean;
}

interface UserDialogProps extends DialogProps {
  readonly intl: IntlShape;
  readonly user: User;
  readonly appt?: Appt;
  readonly className?: string;
}

class UserDialog extends React.Component<UserDialogProps> {
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
      submitting: false,
      submitted: false,
    };
    this.handleSubjectsChange = this.handleSubjectsChange.bind(this);
    this.handleTimeslotChange = this.handleTimeslotChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    this.setState({ submitted: false, submitting: true });
    const [err] = await to<AxiosResponse, AxiosError<ApiError>>(
      axios({
        method: 'post',
        url: '/api/appt',
        data: {
          token: this.context.token,
          appt: this.state.appt.toJSON(),
        },
      })
    );
    if (err && err.response) {
      console.error(`[ERROR] ${err.response.data.msg}`);
    } else if (err && err.request) {
      console.error('[ERROR] No response received:', err.request);
    } else if (err) {
      console.error('[ERROR] While sending request:', err);
    }
    this.setState({ submitted: true, submitting: false });
  }

  /**
   * Renders the `UserDialog` that shows profile info and enables booking.
   */
  public render(): JSX.Element {
    const { user, className, appt, ...rest } = this.props;
    const labels: Record<string, MessageDescriptor> = defineMessages({
      subjects: {
        id: 'user-dialog.subjects',
        description: 'Label for the tutoring lesson subjects field.',
        defaultMessage: 'Subjects',
      },
      time: {
        id: 'user-dialog.time',
        description: 'Label for the tutoring lesson time field.',
        defaultMessage: 'Time',
      },
      timeErr: {
        id: 'user-dialog.time-err',
        description:
          "Error message telling the user that the person they're requesting" +
          " isn't available during the selected times.",
        defaultMessage: '{name} is only available {availability}.',
      },
      message: {
        id: 'user-dialog.message',
        description: 'Label for the tutoring lesson message field.',
        defaultMessage: 'Message',
      },
      submit: {
        id: 'user-dialog.submit',
        description:
          'Label for the submit button that creates the appointment.',
        defaultMessage: 'Request {name}',
      },
      website: {
        id: 'user-dialog.website',
        description: "Link to the user's portfolio website.",
        defaultMessage: 'Portfolio',
      },
      linkedin: {
        id: 'user-dialog.linkedin',
        description: "Link to the user's LinkedIn profile.",
        defaultMessage: 'LinkedIn',
      },
      github: {
        id: 'user-dialog.github',
        description: "Link to the user's GitHub profile.",
        defaultMessage: 'GitHub',
      },
      facebook: {
        id: 'user-dialog.facebook',
        description: "Link to the user's Facebook profile.",
        defaultMessage: 'Facebook',
      },
      instagram: {
        id: 'user-dialog.instagram',
        description: "Link to the user's Instagram profile.",
        defaultMessage: 'Instagram',
      },
    });
    return (
      <Dialog {...rest} open>
        <AnimatedCheckmarkOverlay
          active={this.state.submitting || this.state.submitted}
          checked={this.state.submitted}
        />
        <div className={styles.contentWrapper}>
          <div className={styles.leftSide}>
            <Avatar size='xlarge' name={user.name} className={styles.avatar} />
          </div>
          <div className={styles.rightSide}>
            <Typography className={styles.name} use='headline4'>
              {user.name}
            </Typography>
            {user.socials && !!user.socials.length && (
              <Typography className={styles.socials} use='caption'>
                {user.socials
                  .map<React.ReactNode>((social, index) => (
                    <a key={index} target='_blank' href={social.url}>
                      {this.props.intl.formatMessage(labels[social.type])}
                    </a>
                  ))
                  .reduce((prev, curr) => [prev, ' \u2022 ', curr])}
              </Typography>
            )}
            <Typography className={styles.bio} use='body1'>
              {user.bio}
            </Typography>
            <form className={styles.form} onSubmit={this.handleSubmit}>
              <SubjectSelect
                outlined
                required
                renderToPortal
                label={this.props.intl.formatMessage(labels.subjects)}
                className={styles.formField}
                onChange={this.handleSubjectsChange}
                val={this.state.appt.subjects}
                options={this.props.user.subjects.explicit}
                grade={this.context.grade}
              />
              <TimeslotInput
                outlined
                required
                label={this.props.intl.formatMessage(labels.time)}
                className={styles.formField}
                onChange={this.handleTimeslotChange}
                availability={user.availability}
                val={this.state.appt.time}
                err={this.props.intl.formatMessage(labels.timeErr, {
                  name: user.firstName,
                  availability: user.availability.toString(),
                })}
              />
              <TextField
                outlined
                textarea
                rows={4}
                label={this.props.intl.formatMessage(labels.message)}
                className={styles.formField}
                onChange={this.handleMessageChange}
                value={this.state.appt.message}
              />
              <Button
                className={styles.button}
                label={this.props.intl.formatMessage(labels.submit, {
                  name: user.firstName,
                })}
                disabled={
                  !this.context.uid ||
                  this.state.submitting ||
                  this.state.submitted
                }
                raised
                arrow
              />
              {!this.context.uid && (
                <TextFieldHelperText persistent className={styles.helperText}>
                  <FormattedMessage
                    id='user-dialog.disabled'
                    description={
                      'Helper text prompting the user to login before they ' +
                      'create tutoring lessons.'
                    }
                    defaultMessage={
                      'You must login (via <a>this form</a>) before sending ' +
                      'lesson requests.'
                    }
                    values={{
                      a: (...chunks: React.ReactElement[]) => (
                        <Link href='/pupils'>
                          <a>{chunks}</a>
                        </Link>
                      ),
                    }}
                  />
                </TextFieldHelperText>
              )}
            </form>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default injectIntl(UserDialog);
