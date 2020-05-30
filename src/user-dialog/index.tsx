import React from 'react';
import Utils from '@tutorbook/utils';
import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';
import Avatar from '@tutorbook/avatar';
import Loader from '@tutorbook/loader';

import { UserProvider, UserContext } from '@tutorbook/firebase';
import {
  ApiError,
  User,
  Timeslot,
  Appt,
  ApptJSONInterface,
  Aspect,
} from '@tutorbook/model';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import { Dialog, DialogProps } from '@rmwc/dialog';
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
  readonly appt: Readonly<Appt>;
  readonly submitting: boolean;
  readonly submitted: boolean;
  readonly err?: string;
}

interface UserDialogProps extends DialogProps {
  readonly intl: IntlShape;
  readonly user: User;
  readonly appt?: Appt;
  readonly className?: string;
  readonly aspect: Aspect;
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
              roles: [props.aspect === 'tutoring' ? 'tutor' : 'mentor'],
            },
            {
              uid: this.context.uid,
              roles: [props.aspect === 'tutoring' ? 'tutee' : 'mentee'],
            },
          ],
          subjects: Utils.intersection<string>(
            props.user.tutoring.subjects,
            this.context.searches
          ),
          time:
            props.aspect === 'tutoring'
              ? Utils.intersection<Timeslot>(
                  props.user.availability,
                  this.context.availability,
                  (a, b) => a.equalTo(b)
                )[0]
              : undefined,
        }),
      submitting: false,
      submitted: false,
    };
    this.handleSubjectsChange = this.handleSubjectsChange.bind(this);
    this.handleTimeslotChange = this.handleTimeslotChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  private get items(): firebase.analytics.Item[] {
    return [
      {
        item_id: this.props.user.uid,
        item_name: this.props.user.name,
      },
    ];
  }

  public componentDidUpdate(prevProps: UserDialogProps): void {
    if (this.props.appt && this.props.appt !== prevProps.appt)
      this.setState({ appt: this.props.appt });
  }

  public componentDidMount(): void {
    firebase.analytics().logEvent('view_item', {
      items: this.items,
    });
    firebase.analytics().logEvent('begin_checkout', {
      request: this.state.appt.toJSON(),
      items: this.items,
    });
  }

  private handleSubjectsChange(subjects: string[]): void {
    const appt: Appt = new Appt({ ...this.state.appt, subjects });
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 1,
      request: appt.toJSON(),
      items: this.items,
    });
    this.setState({ appt });
  }

  private handleTimeslotChange(time: Timeslot): void {
    const appt: Appt = new Appt({ ...this.state.appt, time });
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 2,
      request: appt.toJSON(),
      items: this.items,
    });
    this.setState({ appt });
  }

  private handleMessageChange(event: React.FormEvent<HTMLInputElement>): void {
    const message: string = event.currentTarget.value;
    const appt: Appt = new Appt({ ...this.state.appt, message });
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 3,
      request: appt.toJSON(),
      items: this.items,
    });
    this.setState({ appt });
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 4,
      request: this.state.appt.toJSON(),
      items: this.items,
    });
    this.setState({ submitted: false, submitting: true });
    if (!this.context.uid) {
      const [err] = await to(UserProvider.signupWithGoogle(this.context));
      if (err || !this.context.uid)
        return this.setState({
          submitted: false,
          submitting: false,
          err: `An error occurred while logging in with Google. ${
            (err as Error).message
          }`,
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
          token: this.context.token,
          request: this.state.appt.toJSON(),
        },
      })
    );
    if (err && err.response) {
      console.error(`[ERROR] ${err.response.data.msg}`, err.response.data);
      firebase.analytics().logEvent('exception', {
        description: `Request API responded with error: ${err.response.data.msg}`,
        request: this.state.appt.toJSON(),
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
        request: this.state.appt.toJSON(),
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
        request: this.state.appt.toJSON(),
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
        request: this.state.appt.toJSON(),
        fatal: false,
      });
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
      <Dialog {...rest} open className={styles.dialog}>
        <div className={styles.wrapper + (className ? ' ' + className : '')}>
          <Loader
            active={this.state.submitting || this.state.submitted}
            checked={this.state.submitted}
          />
          <div className={styles.left}>
            <a className={styles.img} href={user.photo} target='_blank'>
              <Avatar src={user.photo} />
            </a>
            <h4 className={styles.name}>{user.name}</h4>
            {user.socials && !!user.socials.length && (
              <div className={styles.socials}>
                {user.socials.map((social, index) => (
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
            <p className={styles.bio}>{user.bio}</p>
            <h6 className={styles.requestHeader}>Request</h6>
            <form className={styles.form} onSubmit={this.handleSubmit}>
              <SubjectSelect
                outlined
                required
                renderToPortal
                label={this.props.intl.formatMessage(labels.subjects)}
                className={styles.formField}
                onChange={this.handleSubjectsChange}
                val={this.state.appt.subjects}
                options={this.props.user.tutoring.subjects}
                grade={this.context.grade}
                searchIndex={
                  this.props.aspect === 'mentoring' ? 'expertise' : 'subjects'
                }
              />
              {this.props.aspect === 'tutoring' && (
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
              )}
              <TextField
                outlined
                textarea
                rows={4}
                label={this.props.intl.formatMessage(labels.topic)}
                className={styles.formField}
                onChange={this.handleMessageChange}
                value={this.state.appt.message}
              />
              <Button
                className={styles.button}
                label={
                  !this.context.uid
                    ? 'Signup and request'
                    : `Request ${user.firstName}`
                }
                disabled={this.state.submitting || this.state.submitted}
                google={!this.context.uid}
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
