import React from 'react';
import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';
import Avatar from '@tutorbook/avatar';
import Loader from '@tutorbook/loader';

import { UserProviderState, UserContext } from '@tutorbook/firebase';
import {
  ApiError,
  User,
  Timeslot,
  Appt,
  ApptJSONInterface,
  Aspect,
} from '@tutorbook/model';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import { Dialog } from '@rmwc/dialog';
import { AxiosResponse, AxiosError } from 'axios';
import {
  injectIntl,
  defineMessages,
  IntlShape,
  MessageDescriptor,
} from 'react-intl';

import axios from 'axios';
import to from 'await-to-js';
import firebase from '@tutorbook/firebase';

import styles from './user-dialog.module.scss';

interface UserDialogState {
  readonly time: Timeslot;
  readonly message: string;
  readonly subjects: string[];
  readonly parentName: string;
  readonly parentEmail: string;
  readonly submitting: boolean;
  readonly submitted: boolean;
  readonly err?: string;
}

interface UserDialogProps {
  readonly subjects: string[];
  readonly time: Timeslot;
  readonly intl: IntlShape;
  readonly user: User;
  readonly className?: string;
  readonly aspect: Aspect;
  readonly onClosed: () => any;
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
class UserDialog extends React.Component<UserDialogProps> {
  public readonly state: UserDialogState;
  public static readonly contextType: React.Context<
    UserProviderState
  > = UserContext;

  public constructor(props: UserDialogProps) {
    super(props);
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

  private get appt(): Appt {
    return new Appt({
      attendees: [
        {
          uid: this.context.user.uid,
          roles: [this.props.aspect === 'tutoring' ? 'tutee' : 'mentee'],
        },
        {
          uid: this.props.user.uid,
          roles: [this.props.aspect === 'tutoring' ? 'tutor' : 'mentor'],
        },
      ],
      subjects: this.state.subjects,
      message: this.state.message,
      time: this.state.time,
    });
  }

  private get items(): firebase.analytics.Item[] {
    return [
      {
        item_id: this.props.user.uid,
        item_name: this.props.user.name,
      },
    ];
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

  private handleSubjectsChange(subjects: string[]): void {
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
    const parent: User = new User({
      name: this.state.parentName,
      email: this.state.parentEmail,
    });
    if (!this.context.user.uid) {
      const [err] = await to(
        this.context.signupWithGoogle(
          this.context.user,
          !this.context.user.parents.length ? [parent] : undefined
        )
      );
      if (err || !this.context.user.uid)
        return this.setState({
          submitted: false,
          submitting: false,
          err:
            'An error occurred while logging in with Google.' +
            (err ? ' ' + err.message : ''),
        });
    } else if (!this.context.user.parents.length) {
      const [err] = await to(this.context.signup(this.context.user, [parent]));
      if (err || !this.context.user.parents.length)
        return this.setState({
          submitted: false,
          submitting: false,
          err:
            "An error occurred while creating your parent's profile." +
            (err ? ' ' + err.message : ''),
        });
    }
    const period = (msg: string) => {
      if (msg.endsWith('.')) return msg;
      return msg + '.';
    };
    const [err, res] = await to<
      AxiosResponse<{ request: ApptJSONInterface }>,
      AxiosError<ApiError>
    >(
      axios({
        method: 'post',
        url: '/api/request',
        data: {
          token: await this.context.token(),
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
    } else if (err && err.request) {
      console.error('[ERROR] Request API did not respond:', err.request);
      firebase.analytics().logEvent('exception', {
        description: `Request API did not respond: ${err.request}`,
        request: this.appt.toJSON(),
        fatal: false,
      });
      return this.setState({
        submitted: false,
        submitting: false,
        err:
          'An error occurred while sending your request. Please check your Internet connection and try again.',
      });
    } else if (err) {
      console.error('[ERROR] Calling request API:', err);
      firebase.analytics().logEvent('exception', {
        description: `Error calling request API: ${err}`,
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
    } else if (res) {
      firebase.analytics().logEvent('purchase', {
        transaction_id: res.request.id,
        request: res.request,
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
    this.setState({ submitted: true, submitting: false });
  }

  /**
   * Renders the `UserDialog` that shows profile info and enables booking.
   */
  public render(): JSX.Element {
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
      <Dialog open onClosed={this.props.onClosed} className={styles.dialog}>
        <div className={styles.wrapper}>
          <Loader
            active={this.state.submitting || this.state.submitted}
            checked={this.state.submitted}
          />
          <div className={styles.left}>
            <a
              className={styles.img}
              href={this.props.user.photo}
              target='_blank'
            >
              <Avatar src={this.props.user.photo} />
            </a>
            <h4 className={styles.name}>{this.props.user.name}</h4>
            {this.props.user.socials && !!this.props.user.socials.length && (
              <div className={styles.socials}>
                {this.props.user.socials.map((social, index) => (
                  <a
                    key={index}
                    target='_blank'
                    href={social.url}
                    className={styles.socialLink + ' ' + styles[social.type]}
                  />
                ))}
              </div>
            )}
          </div>
          <div className={styles.right}>
            <h6 className={styles.bioHeader}>About</h6>
            <p className={styles.bio}>{this.props.user.bio}</p>
            <h6 className={styles.requestHeader}>Request</h6>
            <form className={styles.form} onSubmit={this.handleSubmit}>
              {!this.context.user.parents.length && (
                <>
                  <TextField
                    outlined
                    required
                    label={this.props.intl.formatMessage(labels.parentName)}
                    className={styles.formField}
                    onChange={this.handleParentNameChange}
                    value={this.state.parentName}
                  />
                  <TextField
                    outlined
                    required
                    type='email'
                    label={this.props.intl.formatMessage(labels.parentEmail)}
                    className={styles.formField}
                    onChange={this.handleParentEmailChange}
                    value={this.state.parentEmail}
                  />
                </>
              )}
              <SubjectSelect
                outlined
                required
                autoOpenMenu
                renderToPortal
                label={this.props.intl.formatMessage(labels.subjects)}
                className={styles.formField}
                onChange={this.handleSubjectsChange}
                val={this.state.subjects}
                options={this.props.user[this.props.aspect].subjects}
                grade={this.context.user.grade}
                aspect={this.props.aspect}
              />
              {this.props.aspect === 'tutoring' && (
                <TimeslotInput
                  required
                  label={this.props.intl.formatMessage(labels.time)}
                  className={styles.formField}
                  onChange={this.handleTimeslotChange}
                  availability={this.props.user.availability}
                  value={this.state.time}
                />
              )}
              <TextField
                outlined
                textarea
                rows={4}
                label={this.props.intl.formatMessage(labels.topic)}
                className={styles.formField}
                onChange={this.handleMessageChange}
                value={this.state.message}
              />
              <Button
                className={styles.button}
                label={
                  !this.context.user.uid
                    ? 'Signup and request'
                    : `Request ${this.props.user.firstName}`
                }
                disabled={this.state.submitting || this.state.submitted}
                google={!this.context.user.uid}
                raised
                arrow
              />
              {!!this.state.err && (
                <TextFieldHelperText
                  persistent
                  validationMsg
                  className={styles.errMsg}
                >
                  {this.state.err}
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
