import React from 'react';
import Utils from 'lib/utils';
import Button from 'components/button';
import TimeslotInput from 'components/timeslot-input';
import SubjectSelect from 'components/subject-select';
import UserDialog from 'components/user-dialog';
import UserSelect from 'components/user-select';

import firebase from 'lib/firebase';
import {
  ApiError,
  User,
  RoleAlias,
  Timeslot,
  Appt,
  ApptJSON,
  Aspect,
} from 'lib/model';
import { signupWithGoogle } from 'lib/account/signup';
import { UserContextValue, UserContext } from 'lib/account';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { injectIntl, defMsg, Msg, IntlShape, IntlHelper } from 'lib/intl';
import { v4 as uuid } from 'uuid';

import to from 'await-to-js';

import styles from './request-dialog.module.scss';

interface RequestDialogState {
  time?: Timeslot;
  message: string;
  subjects: string[];
  attendees: string[];
  submitting: boolean;
  submitted: boolean;
  err?: string;
}

interface RequestDialogProps {
  subjects: string[];
  time?: Timeslot;
  intl: IntlShape;
  user: User;
  className?: string;
  aspect: Aspect;
  onClosed: () => void;
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
class RequestDialog extends React.Component<
  RequestDialogProps,
  RequestDialogState
> {
  public static readonly contextType: React.Context<
    UserContextValue
  > = UserContext;

  public readonly context: UserContextValue;

  public constructor(props: RequestDialogProps, context: UserContextValue) {
    super(props);
    this.context = context;
    this.state = {
      attendees: [props.user.id, context.user.id],
      subjects: props.subjects,
      time: props.time,
      message: '',
      submitting: false,
      submitted: false,
    };
    this.handleSubjectsChange = this.handleSubjectsChange.bind(this);
    this.handleTimeslotChange = this.handleTimeslotChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleAttendeesChange = this.handleAttendeesChange.bind(this);
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
    const { subjects, message, time, attendees } = this.state;
    return new Appt({
      time,
      message,
      subjects,
      attendees: attendees.map((id: string) => {
        const roles: RoleAlias[] = [];
        if (id === user.id) {
          roles.push(aspect === 'tutoring' ? 'tutor' : 'mentor');
        } else {
          roles.push(aspect === 'tutoring' ? 'tutee' : 'mentee');
        }
        return { id, roles, handle: uuid() };
      }),
    });
  }

  private get items(): firebase.analytics.Item[] {
    const { user } = this.props;
    return [
      {
        item_id: user.id,
        item_name: user.name,
      },
    ];
  }

  private handleAttendeesChange(selected: string[]): void {
    let attendees: string[] = Array.from(selected);
    const {
      user: { id: currentUserId },
    } = this.context;
    const {
      user: { id },
    } = this.props;
    if (selected.indexOf(id) < 0) attendees = [id, ...attendees];
    if (attendees.length < 2) attendees = [...attendees, currentUserId];
    this.setState({ attendees });
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

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    firebase.analytics().logEvent('checkout_progress', {
      checkout_step: 4,
      request: this.appt.toJSON(),
      items: this.items,
    });
    this.setState({ submitted: false, submitting: true });
    const { user: currentUser } = this.context;
    if (!currentUser.id) {
      const [err] = await to(signupWithGoogle(currentUser));
      if (err)
        return this.setState({
          submitted: false,
          submitting: false,
          err: `An error occurred while logging in with Google. ${err.message}`,
        });
    }
    const [err, res] = await to<AxiosResponse<ApptJSON>, AxiosError<ApiError>>(
      axios.post('/api/appts', this.appt.toJSON())
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
        err: `An error occurred while sending your request. ${Utils.period(
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
        err: `An error occurred while sending your request. ${Utils.period(
          err.message
        )} Please check your Internet connection and try again.`,
      });
    }
    const { data: request } = res as AxiosResponse<ApptJSON>;
    firebase.analytics().logEvent('purchase', {
      request,
      items: this.items,
      transaction_id: request.id,
    });
    return this.setState({ submitted: true, submitting: false });
  }

  /**
   * Renders the `RequestDialog` that shows profile info and enables booking.
   */
  public render(): JSX.Element {
    const {
      submitting,
      submitted,
      subjects,
      message,
      time,
      attendees,
      err,
    } = this.state;
    const { onClosed, user, aspect, intl } = this.props;
    const { user: currentUser } = this.context;
    const msg: IntlHelper = (m: Msg, v?: any) => intl.formatMessage(m, v);
    const msgs: Record<string, Msg> = defMsg({
      attendees: {
        id: 'request-dialog.attendees',
        description:
          'Label for the tutoring lesson attendees field used by orgs to ' +
          'send requests on behalf of other users.',
        defaultMessage: 'Attendees',
      },
      subjects: {
        id: 'request-dialog.subjects',
        description: 'Label for the tutoring lesson subjects field.',
        defaultMessage: 'Subjects',
      },
      time: {
        id: 'request-dialog.time',
        description: 'Label for the tutoring lesson time field.',
        defaultMessage: 'Time',
      },
      timeErr: {
        id: 'request-dialog.time-err',
        description:
          "Error message telling the user that the person they're requesting" +
          " isn't available during the selected times.",
        defaultMessage: '{name} is only available {availability}.',
      },
      message: {
        id: 'request-dialog.message',
        description: 'Label for the request message field.',
        defaultMessage: 'Message',
      },
      messagePlaceholder: {
        id: 'request-dialog.message-placeholder',
        description: 'Placeholder for the request message field.',
        defaultMessage:
          'I could really use your help with my {subject} project...',
      },
      submit: {
        id: 'request-dialog.submit',
        defaultMessage: 'Request {name}',
      },
      signUpAndSubmit: {
        id: 'request-dialog.sign-up-and-submit',
        defaultMessage: 'Signup and request',
      },
    });
    return (
      <UserDialog
        onClosed={onClosed}
        submitting={submitting}
        submitted={submitted}
        user={user}
      >
        <h6 className={styles.header}>Request</h6>
        <form className={styles.form} onSubmit={this.handleSubmit}>
          <UserSelect
            required
            outlined
            renderToPortal
            label={msg(msgs.attendees)}
            className={styles.field}
            onChange={this.handleAttendeesChange}
            value={attendees}
          />
          <SubjectSelect
            required
            outlined
            autoOpenMenu
            renderToPortal
            label={msg(msgs.subjects)}
            className={styles.field}
            onChange={this.handleSubjectsChange}
            value={subjects}
            options={user[aspect].subjects}
            aspect={aspect}
          />
          {aspect === 'tutoring' && time && (
            <TimeslotInput
              required
              label={msg(msgs.time)}
              className={styles.field}
              onChange={this.handleTimeslotChange}
              availability={user.availability}
              value={time}
            />
          )}
          <TextField
            outlined
            textarea
            rows={4}
            required
            characterCount
            maxLength={500}
            placeholder={msg(msgs.messagePlaceholder, {
              subject: subjects[0] || 'Computer Science',
            })}
            label={msg(msgs.message)}
            className={styles.field}
            onChange={this.handleMessageChange}
            value={message}
          />
          <Button
            className={styles.button}
            label={
              !currentUser.id
                ? msg(msgs.signUpAndSubmit)
                : msg(msgs.submit, { name: user.firstName })
            }
            disabled={submitting || submitted}
            google={!currentUser.id}
            raised
            arrow
          />
          {!!err && (
            <TextFieldHelperText
              persistent
              validationMsg
              className={styles.error}
            >
              {err}
            </TextFieldHelperText>
          )}
        </form>
      </UserDialog>
    );
  }
}

export default injectIntl(RequestDialog);
