import React from 'react';

import { MessageDescriptor, IntlShape, injectIntl } from 'react-intl';
import { TextField } from '@rmwc/textfield';
import { ListDivider } from '@rmwc/list';
import { Card } from '@rmwc/card';
import {
  Availability,
  UserInterface,
  SocialTypeAlias,
  User,
  Aspect,
  SocialInterface,
  Option,
} from '@tutorbook/model';

import Title from '@tutorbook/title';
import PhotoInput from '@tutorbook/photo-input';
import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';
import LangSelect from '@tutorbook/lang-select';
import Loader from '@tutorbook/loader';
import Button from '@tutorbook/button';

import firebase, {
  AccountContextValue,
  AccountContext,
} from '@tutorbook/firebase';

import msgs from './msgs';
import styles from './volunteer-form.module.scss';

interface VolunteerFormProps {
  intl: IntlShape;
  aspect: Aspect;
}

type VolunteerFormState = {
  headerHeight: number;
  descHeight: number;
  submittingMentor: boolean;
  submittingTutor: boolean;
  submittedMentor: boolean;
  submittedTutor: boolean;
  tutoringSubjects: Option<string>[];
  mentoringSubjects: Option<string>[];
  langs: Option<string>[];
};

/**
 * Wrapper for the two distinct volunteer sign-up forms:
 * 0. The mentor sign-up form where experts (e.g. grad students, professionals)
 * tell us what they're working on so we can match them up with students who are
 * interested in working on the same thing.
 * 1. The volunteer tutor sign-up form where altruistic individuals can sign-up
 * to help tutor somebody affected by COVID-19.
 */
class VolunteerForm extends React.Component<
  VolunteerFormProps,
  VolunteerFormState
> {
  public static readonly contextType: React.Context<
    AccountContextValue
  > = AccountContext;

  public readonly context: AccountContextValue;

  private readonly headerRef: React.RefObject<HTMLHeadingElement>;

  private readonly descRef: React.RefObject<HTMLParagraphElement>;

  public constructor(props: VolunteerFormProps, context: AccountContextValue) {
    super(props);

    this.context = context;
    this.state = {
      headerHeight: 0,
      descHeight: 0,
      submittingMentor: false,
      submittingTutor: false,
      submittedMentor: false,
      submittedTutor: false,
      tutoringSubjects: [],
      mentoringSubjects: [],
      langs: [],
    };

    this.headerRef = React.createRef();
    this.descRef = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public componentDidMount(): void {
    const { headerHeight, descHeight } = this.state;
    if (this.headerRef.current) {
      const newHeight: number = this.headerRef.current.clientHeight;
      if (newHeight !== headerHeight)
        this.setState({ headerHeight: newHeight });
    }
    if (this.descRef.current) {
      const newHeight: number = this.descRef.current.clientHeight;
      if (newHeight !== descHeight) this.setState({ descHeight: newHeight });
    }
  }

  private get submitting(): boolean {
    const { aspect } = this.props;
    const { submittingMentor, submittingTutor } = this.state;
    return aspect === 'mentoring' ? submittingMentor : submittingTutor;
  }

  private get submitted(): boolean {
    const { aspect } = this.props;
    const { submittedMentor, submittedTutor } = this.state;
    return aspect === 'mentoring' ? submittedMentor : submittedTutor;
  }

  private getHeaderStyle(a: Aspect): Record<string, string> {
    const { aspect } = this.props;
    const { headerHeight } = this.state;
    if (aspect === a) return {};
    const height: string = headerHeight ? `${headerHeight}px` : '125px';
    const transform: string =
      aspect === 'mentoring'
        ? `translateY(-${height})`
        : `translateY(${height})`;
    return { transform };
  }

  private getDescStyle(a: Aspect): Record<string, string> {
    const { aspect } = this.props;
    const { descHeight } = this.state;
    if (aspect === a) return {};
    const height: string = descHeight ? `${descHeight}px` : '84px';
    const transform: string =
      aspect === 'mentoring'
        ? `translateY(-${height})`
        : `translateY(${height})`;
    return { transform };
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const { signup, account } = this.context;
    const { aspect } = this.props;
    firebase.analytics().logEvent('sign_up', {
      method: aspect === 'mentoring' ? 'mentor_form' : 'tutor_form',
    });
    this.setState(({ submittingMentor, submittingTutor }) => ({
      submittingMentor: aspect === 'mentoring' || submittingMentor,
      submittingTutor: aspect === 'tutoring' || submittingTutor,
    }));
    await signup(account as User);
    this.setState(
      ({
        submittedMentor,
        submittedTutor,
        submittingMentor,
        submittingTutor,
      }) => ({
        submittedMentor: aspect === 'mentoring' || submittedMentor,
        submittedTutor: aspect === 'tutoring' || submittedTutor,
        submittingMentor: aspect === 'mentoring' && !submittingMentor,
        submittingTutor: aspect === 'tutoring' && !submittingTutor,
      })
    );
    setTimeout(
      () =>
        this.setState(({ submittedMentor, submittedTutor }) => ({
          submittedMentor: aspect === 'mentoring' && !submittedMentor,
          submittedTutor: aspect === 'tutoring' && !submittedTutor,
        })),
      2000
    );
  }

  private renderInputs(): JSX.Element {
    const { intl, aspect } = this.props;
    const { update, account } = this.context;
    const { langs, mentoringSubjects, tutoringSubjects } = this.state;
    const msg = (message: MessageDescriptor) => intl.formatMessage(message);
    if (!(account instanceof User))
      return (
        <div className={styles.switchAccountWrapper}>
          <h5 className={styles.switchAccountHeader}>
            {msg(msgs.switchAccountTitle)}
          </h5>
          <p className={styles.switchAccountBody}>
            {msg(msgs.switchAccountBody)}
          </p>
        </div>
      );
    const sharedProps = {
      className: styles.formField,
      outlined: true,
    };
    const shared = (key: Extract<keyof UserInterface, keyof typeof msgs>) => ({
      ...sharedProps,
      label: msg(msgs[key]),
      onChange: (event: React.FormEvent<HTMLInputElement>) =>
        update(
          new User({
            ...account,
            [key]: event.currentTarget.value,
          })
        ),
    });
    const getSocialIndex = (type: string) => {
      return account.socials.findIndex((s: SocialInterface) => s.type === type);
    };
    const getSocial = (type: SocialTypeAlias) => {
      const index: number = getSocialIndex(type);
      return index >= 0 ? account.socials[index].url : '';
    };
    const hasSocial = (type: SocialTypeAlias) => getSocialIndex(type) >= 0;
    const updateSocial = (type: SocialTypeAlias, url: string) => {
      const index: number = getSocialIndex(type);
      const socials: SocialInterface[] = Array.from(account.socials);
      if (index >= 0) {
        socials[index] = { type, url };
      } else {
        socials.push({ type, url });
      }
      update(new User({ ...account, socials }));
    };
    const s = (type: SocialTypeAlias, placeholder: (v: string) => string) => ({
      ...sharedProps,
      value: getSocial(type),
      label: msg(msgs[type]),
      onFocus: () => {
        const name: string = account.name
          ? account.name.replace(' ', '').toLowerCase()
          : 'yourname';
        if (!hasSocial(type)) updateSocial(type, placeholder(name));
      },
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        updateSocial(type, event.currentTarget.value);
      },
    });
    return (
      <>
        <TextField {...shared('name')} value={account.name} required />
        <TextField {...shared('email')} value={account.email} required />
        <TextField
          {...shared('phone')}
          value={account.phone ? account.phone : undefined}
        />
        <PhotoInput
          {...shared('photo')}
          value={account.photo}
          onChange={(photo: string) => update(new User({ ...account, photo }))}
        />
        <ListDivider className={styles.divider} />
        <LangSelect
          {...sharedProps}
          value={langs}
          values={account.langs}
          label={msg(msgs.lang)}
          onChange={(newLangs: Option<string>[]) => {
            this.setState({ langs: newLangs });
            update(
              new User({
                ...account,
                langs: newLangs.map((lang: Option<string>) => lang.value),
              })
            );
          }}
          required
        />
        {aspect === 'mentoring' && (
          <>
            <SubjectSelect
              {...sharedProps}
              value={mentoringSubjects}
              values={account.mentoring.subjects}
              label={msg(msgs.expertise)}
              placeholder={msg(msgs.expertisePlaceholder)}
              onChange={(subjects: Option<string>[]) => {
                this.setState({ mentoringSubjects: subjects });
                update(
                  new User({
                    ...account,
                    [aspect]: {
                      subjects: subjects.map((subject) => subject.value),
                      searches: account[aspect].searches,
                    },
                  })
                );
              }}
              aspect={aspect}
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                update(
                  new User({
                    ...account,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={account.bio}
              label={msg(msgs.project)}
              placeholder={msg(msgs.projectPlaceholder)}
              required
              rows={4}
              textarea
            />
          </>
        )}
        {aspect === 'tutoring' && (
          <>
            <SubjectSelect
              {...sharedProps}
              value={tutoringSubjects}
              values={account.tutoring.subjects}
              label={msg(msgs.subjects)}
              placeholder={msg(msgs.subjectsPlaceholder)}
              onChange={(subjects: Option<string>[]) => {
                this.setState({ tutoringSubjects: subjects });
                update(
                  new User({
                    ...account,
                    [aspect]: {
                      subjects: subjects.map((subject) => subject.value),
                      searches: account[aspect].searches,
                    },
                  })
                );
              }}
              aspect={aspect}
              required
            />
            <ScheduleInput
              {...shared('availability')}
              value={account.availability}
              onChange={(availability: Availability) =>
                update(
                  new User({
                    ...account,
                    availability,
                  })
                )
              }
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                update(
                  new User({
                    ...account,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={account.bio}
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

  public render(): JSX.Element {
    const { account } = this.context;
    const { intl, aspect } = this.props;
    const label = aspect === 'mentoring' ? msgs.mentorSubmit : msgs.tutorSubmit;
    const msg = (message: MessageDescriptor) => intl.formatMessage(message);
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
            active={this.submitting || this.submitted}
            checked={this.submitted}
          />
          <form className={styles.form} onSubmit={this.handleSubmit}>
            {this.renderInputs()}
            {account instanceof User && (
              <Button
                className={styles.formSubmitButton}
                label={msg(account.id ? msgs.updateSubmit : label)}
                disabled={this.submitting || this.submitted}
                raised
                arrow
              />
            )}
          </form>
        </Card>
      </div>
    );
  }
}

export default injectIntl(VolunteerForm);
