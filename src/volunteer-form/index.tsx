import React from 'react';

import { MessageDescriptor, IntlShape, injectIntl } from 'react-intl';
import { TextField } from '@rmwc/textfield';
import { ListDivider } from '@rmwc/list';
import { Card } from '@rmwc/card';

import Title from '@tutorbook/title';
import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';
import firebase, { UserProviderState, UserContext } from '@tutorbook/firebase';
import {
  Availability,
  UserInterface,
  SocialTypeAlias,
  User,
  Aspect,
  SocialInterface,
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
};

/**
 * Wrapper for the two distinct volunteer sign-up forms:
 * 0. The mentor sign-up form where experts (e.g. grad students, professionals)
 * tell us what they're working on so we can match them up with students who are
 * interested in working on the same thing.
 * 1. The volunteer tutor sign-up form where altruistic individuals can sign-up
 * to help tutor somebody affected by COVID-19.
 */
class VolunteerForm extends React.Component<VolunteerFormProps> {
  public static readonly contextType: React.Context<
    UserProviderState
  > = UserContext;
  public readonly state: VolunteerFormState;

  private readonly headerRef: React.RefObject<HTMLHeadingElement>;

  private readonly descRef: React.RefObject<HTMLParagraphElement>;

  public constructor(props: VolunteerFormProps) {
    super(props);

    this.state = {
      headerHeight: 0,
      descHeight: 0,
      submittingMentor: false,
      submittingTutor: false,
      submittedMentor: false,
      submittedTutor: false,
    };

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
                this.context.user.uid
                  ? msgs.updateSubmit
                  : this.props.aspect === 'mentoring'
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
    const shared = (key: Extract<keyof UserInterface, keyof typeof msgs>) => ({
      ...sharedProps,
      label: msg(msgs[key]),
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        this.context.update(
          new User({
            ...this.context.user,
            [key]: event.currentTarget.value,
          })
        );
      },
    });
    const getSocialIndex = (type: string) => {
      return this.context.user.socials.findIndex(
        (social: SocialInterface) => social.type === type
      );
    };
    const getSocial = (type: SocialTypeAlias) => {
      const index: number = getSocialIndex(type);
      return index >= 0 ? this.context.user.socials[index].url : '';
    };
    const hasSocial = (type: SocialTypeAlias) => getSocialIndex(type) >= 0;
    const updateSocial = (type: SocialTypeAlias, url: string) => {
      const index: number = getSocialIndex(type);
      const socials: SocialInterface[] = Array.from(this.context.user.socials);
      if (index >= 0) {
        socials[index] = { type, url };
      } else {
        socials.push({ type, url });
      }
      this.context.update(new User({ ...this.context.user, socials }));
    };
    const s = (type: SocialTypeAlias, placeholder: (v: string) => string) => ({
      ...sharedProps,
      value: getSocial(type),
      label: msg(msgs[type]),
      onFocus: () => {
        const username: string = this.context.user.name
          ? this.context.user.name.replace(' ', '').toLowerCase()
          : 'yourname';
        if (!hasSocial(type)) updateSocial(type, placeholder(username));
      },
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        updateSocial(type, event.currentTarget.value);
      },
    });
    return (
      <>
        <TextField
          {...shared('name')}
          value={this.context.user.name}
          required
        />
        <TextField
          {...shared('email')}
          value={this.context.user.email}
          required
        />
        <TextField
          {...shared('phone')}
          value={this.context.user.phone ? this.context.user.phone : undefined}
        />
        <ListDivider className={styles.divider} />
        {this.props.aspect === 'mentoring' && (
          <>
            <SubjectSelect
              {...sharedProps}
              val={this.context.user.mentoring.subjects}
              label={msg(msgs.expertise)}
              placeholder={msg(msgs.expertisePlaceholder)}
              onChange={(subjects: string[]) =>
                this.context.update(
                  new User({
                    ...this.context.user,
                    mentoring: {
                      subjects,
                      searches: this.context.user.mentoring.searches,
                    },
                  })
                )
              }
              searchIndex='expertise'
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                this.context.update(
                  new User({
                    ...this.context.user,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={this.context.user.bio}
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
              {...sharedProps}
              val={this.context.user.tutoring.subjects}
              label={msg(msgs.subjects)}
              placeholder={msg(msgs.subjectsPlaceholder)}
              onChange={(subjects: string[]) =>
                this.context.update(
                  new User({
                    ...this.context.user,
                    tutoring: {
                      subjects,
                      searches: this.context.user.tutoring.searches,
                    },
                  })
                )
              }
              required
            />
            <ScheduleInput
              {...shared('availability')}
              val={this.context.user.availability}
              onChange={(availability: Availability) =>
                this.context.update(
                  new User({
                    ...this.context.user,
                    availability,
                  })
                )
              }
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                this.context.update(
                  new User({
                    ...this.context.user,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={this.context.user.bio}
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
        <TextField
          {...s('indiehackers', (v) => `https://indiehackers.com/${v}`)}
        />
      </>
    );
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    firebase.analytics().logEvent('sign_up', {
      method: this.props.aspect === 'mentoring' ? 'mentor_form' : 'tutor_form',
    });
    this.setState({
      submittingMentor:
        this.props.aspect === 'mentoring' || this.state.submittingMentor,
      submittingTutor:
        this.props.aspect === 'tutoring' || this.state.submittingTutor,
    });
    await this.context.signup(this.context.user);
    this.setState({
      submittedMentor:
        this.props.aspect === 'mentoring' || this.state.submittedMentor,
      submittedTutor:
        this.props.aspect === 'tutoring' || this.state.submittedTutor,
    });
  }
}

export default injectIntl(VolunteerForm);
