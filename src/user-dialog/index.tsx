import React from 'react';
import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';
import Avatar from '@tutorbook/avatar';
import Loader from '@tutorbook/loader';

import firebase, { UserContextValue, UserContext } from '@tutorbook/firebase';
import {
  ApiError,
  User,
  Timeslot,
  Appt,
  ApptJSONInterface,
  Aspect,
  Option,
} from '@tutorbook/model';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import { Dialog } from '@rmwc/dialog';
import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  injectIntl,
  defineMessages,
  IntlShape,
  MessageDescriptor,
} from 'react-intl';

import to from 'await-to-js';

import styles from './user-dialog.module.scss';

interface UserDialogState {
  time?: Timeslot;
  message: string;
  subjects: Option<string>[];
  parentName: string;
  parentEmail: string;
  submitting: boolean;
  submitted: boolean;
  err?: string;
}

interface UserDialogProps {
  subjects: Option<string>[];
  time?: Timeslot;
  intl: IntlShape;
  user: User;
  className?: string;
  aspect: Aspect;
  onClosed: () => any;
}

/**
 * Google Analytics checkout steps are defined as:
 * 0. Opening the user dialog (logged in `src/search/lib/results.tsx`).
 * 1. (Optional) Selecting a subject (optional b/c subjects are pre-selected).
 * 2. (Optional) Selecting a timeslot (optional b/c timeslot is pre-selected).
 * 3. (Optional) Adding a request message.
 * 4. Sending the request (we only log a `purchase` event once the request has
 * been successfully sent by our API).
 */
class UserDialog extends React.Component<UserDialogProps, UserDialogState> {
  public static readonly contextType: React.Context<
    UserContextValue
  > = UserContext;

  public readonly context: UserContextValue;

  public constructor(props: UserDialogProps, context: UserContextValue) {
    super(props);
    this.context = context;
    this.state = {
      subjects: props.subjects,
      time: props.time,
      message: '',
      parentName: '',
      parentEmail: '',
      submitting: false,
      submitted: false,
    };
    this.handleSubjectsChange = this.handleSubjectsChange.bind(this);
    this.handleTimeslotChange = this.handleTimeslotChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleParentNameChange = this.handleParentNameChange.bind(this);
    this.handleParentEmailChange = this.handleParentEmailChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public componentDidMount(): void {
    firebase.analytics().logEvent('view_item', {
      items: this.items,
    });
    firebase.analytics().logEvent('begin_checkout', {
      request: this.appt.toJSON(),
      items: this.items,
    });
  }

  private get appt(): Appt {
    const { aspect, user } = this.props;
    const { subjects, message, time } = this.state;
    return new Appt({
      time,
      message,
      attendees: [
        {
          /* eslint-disable-next-line react/destructuring-assignment */
          uid: this.context.user.uid,
          roles: [aspect === 'tutoring' ? 'tutee' : 'mentee'],
        },
        {
          uid: user.uid,
          roles: [aspect === 'tutoring' ? 'tutor' : 'mentor'],
        },
      ],
      subjects: subjects.map((s: Option<string>) => s.value),
    });
  }

  private get items(): firebase.analytics.Item[] {
    const { user } = this.props;
    return [
      {
        item_id: user.uid,
        item_name: user.name,
      },
    ];
  }

  private handleSubjectsChange(subjects: Option<string>[]): void {
    this.setState({ subjects });
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 1,
      request: this.appt.toJSON(),
      items: this.items,
    });
  }

  private handleTimeslotChange(time: Timeslot): void {
    this.setState({ time });
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 2,
      request: this.appt.toJSON(),
      items: this.items,
    });
  }

  private handleMessageChange(event: React.FormEvent<HTMLInputElement>): void {
    const message: string = event.currentTarget.value;
    this.setState({ message });
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 3,
      request: this.appt.toJSON(),
      items: this.items,
    });
  }

  private handleParentNameChange(
    event: React.FormEvent<HTMLInputElement>
  ): void {
    const parentName: string = event.currentTarget.value;
    this.setState({ parentName });
  }

  private handleParentEmailChange(
    event: React.FormEvent<HTMLInputElement>
  ): void {
    const parentEmail: string = event.currentTarget.value;
    this.setState({ parentEmail });
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 4,
      request: this.appt.toJSON(),
      items: this.items,
    });
    this.setState({ submitted: false, submitting: true });
    const { parentName, parentEmail } = this.state;
    const { user, signup, signupWithGoogle, token } = this.context;
    const parent: User = new User({ name: parentName, email: parentEmail });
    if (!user.uid) {
      const [err] = await to(
        signupWithGoogle(user, !user.parents.length ? [parent] : undefined)
      );
      if (err || !user.uid)
        return this.setState({
          submitted: false,
          submitting: false,
          err: `An error occurred while logging in with Google.${
            err ? ` ${err.message}` : ''
          }`,
        });
    } else if (!user.parents.length) {
      const [err] = await to(signup(user, [parent]));
      if (err || !user.parents.length)
        return this.setState({
          submitted: false,
          submitting: false,
          err: `An error occurred while creating your parent's profile.${
            err ? ` ${err.message}` : ''
          }`,
        });
    }
    const period = (msg: string) => {
      if (msg.endsWith('.')) return msg;
      return `${msg}.`;
    };
    const [err, res] = await to<
      AxiosResponse<{ request: ApptJSONInterface }>,
      AxiosError<ApiError>
    >(
      axios({
        method: 'post',
        url: '/api/request',
        data: {
          token: await token(),
          request: this.appt.toJSON(),
        },
      })
    );
    if (err && err.response) {
      console.error(`[ERROR] ${err.response.data.msg}`, err.response.data);
      firebase.analytics().logEvent('exception', {
        description: `Request API responded with error: ${err.response.data.msg}`,
        request: this.appt.toJSON(),
        fatal: false,
      });
      return this.setState({
        submitted: false,
        submitting: false,
        err: `An error occurred while sending your request. ${period(
          err.response.data.msg || err.message
        )}`,
      });
    }
    if (err && err.request) {
      console.error('[ERROR] Request API did not respond:', err.request);
      firebase.analytics().logEvent('exception', {
        description: 'Request API did not respond.',
        request: this.appt.toJSON(),
        fatal: false,
      });
      return this.setState({
        submitted: false,
        submitting: false,
        err:
          'An error occurred while sending your request. Please check your Internet connection and try again.',
      });
    }
    if (err) {
      console.error('[ERROR] Calling request API:', err);
      firebase.analytics().logEvent('exception', {
        description: `Error calling request API: ${err.message}`,
        request: this.appt.toJSON(),
        fatal: false,
      });
      return this.setState({
        submitted: false,
        submitting: false,
        err: `An error occurred while sending your request. ${period(
          err.message
        )} Please check your Internet connection and try again.`,
      });
    }
    if (res) {
      firebase.analytics().logEvent('purchase', {
        transaction_id: res.data.request.id,
        request: res.data.request,
        items: this.items,
      });
    } else {
      // This should never actually happen, but we include it here just in case.
      console.warn('[WARNING] No error or response from request API.');
      firebase.analytics().logEvent('exception', {
        description: 'No error or response from request API.',
        request: this.appt.toJSON(),
        fatal: false,
      });
    }
    return this.setState({ submitted: true, submitting: false });
  }

  /**
   * Renders the `UserDialog` that shows profile info and enables booking.
   */
  public render(): JSX.Element {
    const {
      submitting,
      submitted,
      parentName,
      parentEmail,
      subjects,
      message,
      time,
      err,
    } = this.state;
    const { onClosed, user, aspect, intl } = this.props;
    /* eslint-disable-next-line react/destructuring-assignment */
    const currentUser = this.context.user;
    const labels: Record<string, MessageDescriptor> = defineMessages({
      parentName: {
        id: 'user-dialog.parent-name',
        defaultMessage: "Your parent's name",
      },
      parentEmail: {
        id: 'user-dialog.parent-email',
        defaultMessage: "Your parent's email address",
      },
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
      topic: {
        id: 'user-dialog.topic',
        description:
          'Label for the tutoring lesson topic (previously message) field.',
        defaultMessage: 'Topic',
      },
      submit: {
        id: 'user-dialog.submit',
        description:
          'Label for the submit button that creates the appointment.',
        defaultMessage: 'Request {name}',
      },
    });
    return (
      <Dialog open onClosed={onClosed} className={styles.dialog}>
        <div className={styles.wrapper}>
          <Loader active={submitting || submitted} checked={submitted} />
          <div className={styles.left}>
            <a
              className={styles.img}
              href={user.photo}
              target='_blank'
              rel='noreferrer'
              tabIndex={-1}
            >
              <Avatar src={user.photo} />
            </a>
            <h4 className={styles.name}>{user.name}</h4>
            {user.socials && !!user.socials.length && (
              <div className={styles.socials}>
                {user.socials.map((social) => (
                  <a
                    key={social.type}
                    target='_blank'
                    rel='noreferrer'
                    href={social.url}
                    className={`${styles.socialLink} ${styles[social.type]}`}
                  >
                    {social.type}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className={styles.right}>
            <h6 className={styles.bioHeader}>About</h6>
            <p className={styles.bio}>{user.bio}</p>
            <h6 className={styles.requestHeader}>Request</h6>
            <form className={styles.form} onSubmit={this.handleSubmit}>
              {!currentUser.parents.length && (
                <>
                  <TextField
                    outlined
                    required
                    label={intl.formatMessage(labels.parentName)}
                    className={styles.formField}
                    onChange={this.handleParentNameChange}
                    value={parentName}
                  />
                  <TextField
                    outlined
                    required
                    type='email'
                    label={intl.formatMessage(labels.parentEmail)}
                    className={styles.formField}
                    onChange={this.handleParentEmailChange}
                    value={parentEmail}
                  />
                </>
              )}
              <SubjectSelect
                required
                autoOpenMenu
                renderToPortal
                label={intl.formatMessage(labels.subjects)}
                className={styles.formField}
                onChange={this.handleSubjectsChange}
                value={subjects}
                options={user[aspect].subjects}
                grade={currentUser.grade}
                aspect={aspect}
              />
              {aspect === 'tutoring' && time && (
                <TimeslotInput
                  required
                  label={intl.formatMessage(labels.time)}
                  className={styles.formField}
                  onChange={this.handleTimeslotChange}
                  availability={user.availability}
                  value={time}
                />
              )}
              <TextField
                outlined
                textarea
                rows={4}
                label={intl.formatMessage(labels.topic)}
                className={styles.formField}
                onChange={this.handleMessageChange}
                value={message}
              />
              <Button
                className={styles.button}
                label={
                  !currentUser.uid
                    ? 'Signup and request'
                    : `Request ${user.firstName}`
                }
                disabled={submitting || submitted}
                google={!currentUser.uid}
                raised
                arrow
              />
              {!!err && (
                <TextFieldHelperText
                  persistent
                  validationMsg
                  className={styles.errMsg}
                >
                  {err}
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
