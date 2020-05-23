import React from 'react';

import { MessageDescriptor, IntlShape, injectIntl } from 'react-intl';
import { TextField } from '@rmwc/textfield';
import { ListDivider } from '@rmwc/list';
import { Typography } from '@rmwc/typography';
import { Card } from '@rmwc/card';

import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';
import firebase, { UserProvider } from '@tutorbook/firebase';
import {
  Availability,
  UserInterface,
  SocialTypeAlias,
  User,
} from '@tutorbook/model';
import CheckmarkOverlay from '@tutorbook/checkmark-overlay';
import Button from '@tutorbook/button';

import Toggle from './toggle';

import msgs from './msgs';
import styles from './volunteer-form.module.scss';

interface VolunteerFormProps {
  readonly intl: IntlShape;
}

type VolunteerFormState = {
  readonly headerHeight: number;
  readonly descHeight: number;
  readonly submittingMentor: boolean;
  readonly submittingTutor: boolean;
  readonly submittedMentor: boolean;
  readonly submittedTutor: boolean;
  readonly activeForm: 0 | 1;
  readonly expertise: string[];
} & Partial<UserInterface> &
  { [type in SocialTypeAlias]: string };

/**
 * Wrapper for the two distinct volunteer sign-up forms:
 * 0. The mentor sign-up form where experts (e.g. grad students, professionals)
 * tell us what they're working on so we can match them up with students who are
 * interested in working on the same thing.
 * 1. The volunteer tutor sign-up form where altruistic individuals can sign-up
 * to help tutor somebody affected by COVID-19.
 */
class VolunteerForm extends React.Component<VolunteerFormProps> {
  public readonly state: VolunteerFormState = {
    headerHeight: 0,
    descHeight: 0,
    submittingMentor: false,
    submittingTutor: false,
    submittedMentor: false,
    submittedTutor: false,
    activeForm: 0,
    name: '',
    email: '',
    phone: '',
    bio: '',
    source: '',
    expertise: [],
    subjects: [],
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
  };

  private readonly headerRef: React.RefObject<HTMLHeadingElement>;

  private readonly descRef: React.RefObject<HTMLParagraphElement>;

  public constructor(props: VolunteerFormProps) {
    super(props);
    this.headerRef = React.createRef();
    this.descRef = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public render(): JSX.Element {
    const msg = (msg: MessageDescriptor) => this.props.intl.formatMessage(msg);
    return (
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <Toggle
            options={[
              this.props.intl.formatMessage(msgs.mentorToggle),
              this.props.intl.formatMessage(msgs.tutorToggle),
            ]}
            onChange={(activeForm: 0 | 1) => this.setState({ activeForm })}
          />
          <Typography
            ref={this.headerRef}
            className={styles.header}
            use='headline2'
          >
            <span style={this.getHeaderStyle(0)}>{msg(msgs.mentorHeader)}</span>
            <span style={this.getHeaderStyle(1)}>{msg(msgs.tutorHeader)}</span>
          </Typography>
          <Typography
            ref={this.descRef}
            className={styles.description}
            use='body1'
          >
            <span style={this.getDescStyle(0)}>{msg(msgs.mentorDesc)}</span>
            <span style={this.getDescStyle(1)}>{msg(msgs.tutorDesc)}</span>
          </Typography>
        </div>
        <div className={styles.formWrapper}>
          <div className={styles.content}>
            <Card className={styles.formCard}>
              <CheckmarkOverlay
                active={this.loading || this.checked}
                checked={this.checked}
              />
              <form className={styles.form} onSubmit={this.handleSubmit}>
                {this.renderInputs()}
                <Button
                  className={styles.formSubmitButton}
                  label={msg(
                    this.state.activeForm === 0
                      ? msgs.mentorSubmit
                      : msgs.tutorSubmit
                  )}
                  disabled={this.loading || this.checked}
                  raised
                  arrow
                />
              </form>
            </Card>
          </div>
          <div className={styles.background} />
        </div>
      </div>
    );
  }

  private get loading(): boolean {
    const loadingMentor: boolean =
      this.state.submittingMentor || this.state.submittedMentor;
    const loadingTutor: boolean =
      this.state.submittingTutor || this.state.submittedTutor;
    return this.state.activeForm === 0 ? loadingMentor : loadingTutor;
  }

  private get checked(): boolean {
    const checkedMentor: boolean =
      this.state.submittedMentor || this.state.submittedMentor;
    const checkedTutor: boolean =
      this.state.submittedTutor || this.state.submittedTutor;
    return this.state.activeForm === 0 ? checkedMentor : checkedTutor;
  }

  public componentDidMount(): void {
    if (this.headerRef.current) {
      const headerHeight: number = this.headerRef.current.clientHeight;
      if (headerHeight !== this.state.headerHeight)
        this.setState({ headerHeight });
    }
    if (this.descRef.current) {
      const descHeight: number = this.descRef.current.clientHeight;
      if (descHeight !== this.state.descHeight) this.setState({ descHeight });
    }
  }

  private getHeaderStyle(form: 0 | 1): Record<string, string> {
    if (this.state.activeForm === form) return {};
    const height: string = this.state.headerHeight
      ? `${this.state.headerHeight}px`
      : '3.75rem';
    const updated: string = form === 1 ? `-${height}` : height;
    return { transform: `translateY(${updated})` };
  }

  private getDescStyle(form: 0 | 1): Record<string, string> {
    if (this.state.activeForm === form) return {};
    const height: string = this.state.descHeight
      ? `${this.state.descHeight}px`
      : '4.5rem';
    const updated: string = form === 1 ? `-${height}` : height;
    return { transform: `translateY(${updated})` };
  }

  private renderInputs(): JSX.Element {
    const msg = (msg: MessageDescriptor) => this.props.intl.formatMessage(msg);
    const sharedProps = {
      className: styles.formField,
      outlined: true,
      required: true,
    };
    const shared = (key: keyof VolunteerFormState) => ({
      ...sharedProps,
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        this.setState({ [key]: event.currentTarget.value });
      },
    });
    const s = (id: string, placeholder: (v: string) => string) => ({
      ...sharedProps,
      value: (this.state as Record<string, any>)[id],
      label: msg((msgs as Record<string, MessageDescriptor>)[id]),
      type: 'url',
      onFocus: () => {
        const username: string = this.state.name
          ? this.state.name.replace(' ', '').toLowerCase()
          : 'yourname';
        if (!(this.state as Record<string, any>)[id])
          this.setState({ [id]: placeholder(username) });
      },
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        this.setState({ [id]: event.currentTarget.value });
      },
      required: false,
    });
    return (
      <>
        <TextField {...shared('name')} label={msg({ id: 'form.name' })} />
        <TextField {...shared('email')} label={msg({ id: 'form.email' })} />
        <TextField
          {...shared('phone')}
          required={false}
          label={msg({ id: 'form.phone' })}
        />
        <ListDivider className={styles.divider} />
        {this.state.activeForm === 0 && (
          <>
            <TextField
              {...shared('source')}
              label={msg(msgs.source)}
              placeholder={msg(msgs.sourcePlaceholder)}
              required={false}
            />
            <SubjectSelect
              {...shared('expertise')}
              label={msg(msgs.expertise)}
              placeholder={msg(msgs.expertisePlaceholder)}
              onChange={(expertise: string[]) => this.setState({ expertise })}
              searchIndex='expertise'
            />
            <TextField
              {...shared('bio')}
              label={msg(msgs.project)}
              placeholder={msg(msgs.projectPlaceholder)}
              rows={4}
              textarea
            />
          </>
        )}
        {this.state.activeForm === 1 && (
          <>
            <SubjectSelect
              {...shared('subjects')}
              label={msg(msgs.subjects)}
              placeholder={msg({ id: 'form.subjects-placeholder' })}
              onChange={(subjects: string[]) => this.setState({ subjects })}
            />
            <ScheduleInput
              {...shared('availability')}
              label={msg(msgs.availability)}
              onChange={(availability: Availability) =>
                this.setState({ availability })
              }
            />
            <TextField
              {...shared('bio')}
              label={msg(msgs.experience)}
              placeholder={msg(msgs.experiencePlaceholder)}
              rows={4}
              textarea
            />
          </>
        )}
        <ListDivider className={styles.divider} />
        <TextField {...s('website', (v) => `https://${v}.com`)} />
        <TextField {...s('linkedin', (v) => `https://linkedin.com/in/${v}`)} />
        <TextField {...s('twitter', (v) => `https://twitter.com/${v}`)} />
        <TextField {...s('facebook', (v) => `https://facebook.com/${v}`)} />
        <TextField {...s('instagram', (v) => `https://instagram.com/${v}`)} />
      </>
    );
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    firebase.analytics().logEvent('sign_up', {
      method: this.state.activeForm === 0 ? 'mentor_form' : 'tutor_form',
    });
    const socials = ([
      'website',
      'linkedin',
      'facebook',
      'twitter',
      'instagram',
    ] as SocialTypeAlias[]).map((type: SocialTypeAlias) => ({
      type,
      url: (this.state as Record<string, any>)[type] as string,
    }));
    const tutor: User = new User({ ...this.state, socials });
    this.setState({
      submittingMentor:
        this.state.activeForm === 0 || this.state.submittingMentor,
      submittingTutor:
        this.state.activeForm === 1 || this.state.submittingTutor,
    });
    await UserProvider.signup(tutor);
    this.setState({
      submittedMentor:
        this.state.activeForm === 0 || this.state.submittedMentor,
      submittedTutor: this.state.activeForm === 1 || this.state.submittedTutor,
    });
  }
}

export default injectIntl(VolunteerForm);
