import React from 'react';

import { MessageDescriptor, IntlShape, injectIntl } from 'react-intl';
import { TextField } from '@rmwc/textfield';
import { ListDivider } from '@rmwc/list';
import { Card } from '@rmwc/card';

import Title from '@tutorbook/title';
import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';
import firebase, { UserProvider } from '@tutorbook/firebase';
import {
  Availability,
  UserInterface,
  SocialTypeAlias,
  User,
  Aspect,
} from '@tutorbook/model';
import Loader from '@tutorbook/loader';
import Button from '@tutorbook/button';

import msgs from './msgs';
import styles from './volunteer-form.module.scss';

interface VolunteerFormProps {
  readonly intl: IntlShape;
  readonly aspect: Aspect;
}

type VolunteerFormState = {
  readonly headerHeight: number;
  readonly descHeight: number;
  readonly submittingMentor: boolean;
  readonly submittingTutor: boolean;
  readonly submittedMentor: boolean;
  readonly submittedTutor: boolean;
  readonly expertise: string[];
  readonly subjects: string[];
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
    name: '',
    email: '',
    phone: '',
    bio: '',
    expertise: [],
    subjects: [],
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    github: '',
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
        <div className={styles.header} ref={this.headerRef}>
          <span style={this.getHeaderStyle('mentoring')}>
            <Title>{msg(msgs.mentorHeader)}</Title>
          </span>
          <span style={this.getHeaderStyle('tutoring')}>
            <Title>{msg(msgs.tutorHeader)}</Title>
          </span>
        </div>
        <div className={styles.description} ref={this.descRef}>
          <span style={this.getDescStyle('mentoring')}>
            {msg(msgs.mentorDesc)}
          </span>
          <span style={this.getDescStyle('tutoring')}>
            {msg(msgs.tutorDesc)}
          </span>
        </div>
        <Card className={styles.formCard}>
          <Loader
            active={this.loading || this.checked}
            checked={this.checked}
          />
          <form className={styles.form} onSubmit={this.handleSubmit}>
            {this.renderInputs()}
            <Button
              className={styles.formSubmitButton}
              label={msg(
                this.props.aspect === 'mentoring'
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
    );
  }

  private get loading(): boolean {
    const loadingMentor: boolean =
      this.state.submittingMentor || this.state.submittedMentor;
    const loadingTutor: boolean =
      this.state.submittingTutor || this.state.submittedTutor;
    return this.props.aspect === 'mentoring' ? loadingMentor : loadingTutor;
  }

  private get checked(): boolean {
    const checkedMentor: boolean =
      this.state.submittedMentor || this.state.submittedMentor;
    const checkedTutor: boolean =
      this.state.submittedTutor || this.state.submittedTutor;
    return this.props.aspect === 'mentoring' ? checkedMentor : checkedTutor;
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

  private getHeaderStyle(aspect: Aspect): Record<string, string> {
    if (this.props.aspect === aspect) return {};
    const height: string = this.state.headerHeight
      ? `${this.state.headerHeight}px`
      : '125px';
    const transform: string =
      aspect === 'mentoring'
        ? `translateY(-${height})`
        : `translateY(${height})`;
    return { transform };
  }

  private getDescStyle(aspect: Aspect): Record<string, string> {
    if (this.props.aspect === aspect) return {};
    const height: string = this.state.descHeight
      ? `${this.state.descHeight}px`
      : '84px';
    const transform: string =
      aspect === 'mentoring'
        ? `translateY(-${height})`
        : `translateY(${height})`;
    return { transform };
  }

  private renderInputs(): JSX.Element {
    const msg = (msg: MessageDescriptor) => this.props.intl.formatMessage(msg);
    const sharedProps = {
      className: styles.formField,
      outlined: true,
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
    });
    return (
      <>
        <TextField
          {...shared('name')}
          label={msg({ id: 'form.name' })}
          required
        />
        <TextField
          {...shared('email')}
          label={msg({ id: 'form.email' })}
          required
        />
        <TextField {...shared('phone')} label={msg({ id: 'form.phone' })} />
        <ListDivider className={styles.divider} />
        {this.props.aspect === 'mentoring' && (
          <>
            <SubjectSelect
              {...shared('expertise')}
              label={msg(msgs.expertise)}
              placeholder={msg(msgs.expertisePlaceholder)}
              onChange={(expertise: string[]) => this.setState({ expertise })}
              searchIndex='expertise'
              required
            />
            <TextField
              {...shared('bio')}
              label={msg(msgs.project)}
              placeholder={msg(msgs.projectPlaceholder)}
              required
              rows={4}
              textarea
            />
          </>
        )}
        {this.props.aspect === 'tutoring' && (
          <>
            <SubjectSelect
              {...shared('subjects')}
              label={msg(msgs.subjects)}
              placeholder={msg({ id: 'form.subjects-placeholder' })}
              onChange={(subjects: string[]) => this.setState({ subjects })}
              required
            />
            <ScheduleInput
              {...shared('availability')}
              label={msg(msgs.availability)}
              onChange={(availability: Availability) =>
                this.setState({ availability })
              }
              required
            />
            <TextField
              {...shared('bio')}
              label={msg(msgs.experience)}
              placeholder={msg(msgs.experiencePlaceholder)}
              required
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
        <TextField {...s('github', (v) => `https://github.com/${v}`)} />
      </>
    );
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    firebase.analytics().logEvent('sign_up', {
      method: this.props.aspect === 'mentoring' ? 'mentor_form' : 'tutor_form',
    });
    const {
      expertise,
      subjects,
      website,
      linkedin,
      facebook,
      twitter,
      instagram,
      github,
    } = this.state;
    const tutor: User = new User({
      ...this.state,
      socials: [
        {
          type: 'website',
          url: website,
        },
        {
          type: 'linkedin',
          url: linkedin,
        },
        {
          type: 'facebook',
          url: facebook,
        },
        {
          type: 'twitter',
          url: twitter,
        },
        {
          type: 'instagram',
          url: instagram,
        },
        {
          type: 'github',
          url: github,
        },
      ],
      tutoring: { subjects: subjects, searches: [] },
      mentoring: { subjects: expertise, searches: [] },
    });
    this.setState({
      submittingMentor:
        this.props.aspect === 'mentoring' || this.state.submittingMentor,
      submittingTutor:
        this.props.aspect === 'tutoring' || this.state.submittingTutor,
    });
    await UserProvider.signup(tutor);
    this.setState({
      submittedMentor:
        this.props.aspect === 'mentoring' || this.state.submittedMentor,
      submittedTutor:
        this.props.aspect === 'tutoring' || this.state.submittedTutor,
    });
  }
}

export default injectIntl(VolunteerForm);
