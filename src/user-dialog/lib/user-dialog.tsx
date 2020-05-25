import React from 'react';
import Utils from '@tutorbook/utils';
import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';
import Loader from '@tutorbook/loader';
import { Link } from '@tutorbook/intl';
import { UserContext } from '@tutorbook/firebase';
import {
  ApiError,
  User,
  Timeslot,
  Appt,
  ApptJSONInterface,
} from '@tutorbook/model';
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
import firebase from '@tutorbook/firebase';

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
              roles: ['tutor'],
            },
            {
              uid: this.context.uid,
              roles: ['tutee'],
            },
          ],
          subjects: Utils.intersection<string>(
            props.user.tutoring.subjects,
            this.context.searches
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
    } else if (err && err.request) {
      console.error('[ERROR] Request API did not respond:', err.request);
      firebase.analytics().logEvent('exception', {
        description: `Request API did not respond: ${err.request}`,
        request: this.state.appt.toJSON(),
        fatal: false,
      });
    } else if (err) {
      console.error('[ERROR] Calling request API:', err);
      firebase.analytics().logEvent('exception', {
        description: `Error calling request API: ${err}`,
        request: this.state.appt.toJSON(),
        fatal: false,
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
    });
    return (
      <Dialog {...rest} open>
        <Loader
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
                      {this.props.intl.formatMessage({
                        id: `socials.${social.type}`,
                      })}
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
                options={this.props.user.tutoring.subjects}
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
