import React from 'react';
import Utils from '@tutorbook/utils';
import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';
import UserDialog from '@tutorbook/user-dialog';

import firebase from '@tutorbook/firebase';
import {
  ApiError,
  User,
  Timeslot,
  Appt,
  ApptJSONInterface,
  Aspect,
  Option,
} from '@tutorbook/model';
import { UserContextValue, UserContext } from '@tutorbook/account';
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  injectIntl,
  defMsg,
  Msg,
  IntlShape,
  IntlHelper,
} from '@tutorbook/intl';

import to from 'await-to-js';

import styles from './request-dialog.module.scss';

interface RequestDialogState {
  time?: Timeslot;
  message: string;
  subjects: Option<string>[];
  parentName: string;
  parentEmail: string;
  submitting: boolean;
  submitted: boolean;
  err?: string;
}

interface RequestDialogProps {
  subjects: Option<string>[];
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
    const { user: currentUser } = this.context;
    return new Appt({
      time,
      message,
      attendees: [
        {
          id: currentUser.id,
          roles: [aspect === 'tutoring' ? 'tutee' : 'mentee'],
        },
        {
          id: user.id,
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
        item_id: user.id,
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
    const { user: currentUser } = this.context;
    const parent: User = new User({ name: parentName, email: parentEmail });
    if (!currentUser.id) {
      const [err] = await to(
        signupWithGoogle(
          currentUser,
          !currentUser.parents.length ? [parent] : undefined
        )
      );
      if (err || !currentUser.id)
        return this.setState({
          submitted: false,
          submitting: false,
          err:
            'An error occurred while logging in with Google.' +
            `${err ? ` ${err.message}` : ''}`,
        });
    } else if (!currentUser.parents.length) {
      const [err] = await to(signup(currentUser, [parent]));
      if (err || !currentUser.parents.length)
        return this.setState({
          submitted: false,
          submitting: false,
          err:
            "An error occurred while creating your parent's profile." +
            `${err ? ` ${err.message}` : ''}`,
        });
    }
    const [err, res] = await to<
      AxiosResponse<ApptJSONInterface>,
      AxiosError<ApiError>
    >(
      axios({
        method: 'post',
        url: '/api/requests',
        data: { request: this.appt.toJSON() },
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
    const { data: request } = res as AxiosResponse<ApptJSONInterface>;
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
      parentName,
      parentEmail,
      subjects,
      message,
      time,
      err,
    } = this.state;
    const { onClosed, user, aspect, intl } = this.props;
    const { user: currentUser } = this.context;
    const msg: IntlHelper = (m: Msg, v?: any) => intl.formatMessage(m, v);
    const labels: Record<string, Msg> = defMsg({
      parentName: {
        id: 'request-dialog.parent-name',
        defaultMessage: "Your parent's name",
      },
      parentEmail: {
        id: 'request-dialog.parent-email',
        defaultMessage: "Your parent's email address",
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
      topic: {
        id: 'request-dialog.topic',
        description:
          'Label for the tutoring lesson topic (previously message) field.',
        defaultMessage: 'Topic',
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
          {!currentUser.parents.length && (
            <>
              <TextField
                outlined
                required
                label={msg(labels.parentName)}
                className={styles.field}
                onChange={this.handleParentNameChange}
                value={parentName}
              />
              <TextField
                outlined
                required
                type='email'
                label={msg(labels.parentEmail)}
                className={styles.field}
                onChange={this.handleParentEmailChange}
                value={parentEmail}
              />
            </>
          )}
          <SubjectSelect
            required
            autoOpenMenu
            renderToPortal
            label={msg(labels.subjects)}
            className={styles.field}
            onChange={this.handleSubjectsChange}
            value={subjects}
            options={user[aspect].subjects}
            aspect={aspect}
          />
          {aspect === 'tutoring' && time && (
            <TimeslotInput
              required
              label={msg(labels.time)}
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
            label={msg(labels.topic)}
            className={styles.field}
            onChange={this.handleMessageChange}
            value={message}
          />
          <Button
            className={styles.button}
            label={
              !currentUser.id
                ? msg(labels.signUpAndSubmit)
                : msg(labels.submit, { name: user.firstName })
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
