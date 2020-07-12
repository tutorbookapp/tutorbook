import React from 'react';

import { MessageDescriptor, IntlShape, injectIntl } from 'react-intl';
import { UserContextValue, UserContext } from 'lib/account';
import { signup } from 'lib/account/signup';
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
} from 'lib/model';

import Title from 'components/title';
import PhotoInput from 'components/photo-input';
import ScheduleInput from 'components/schedule-input';
import SubjectSelect from 'components/subject-select';
import LangSelect from 'components/lang-select';
import Loader from 'components/loader';
import Button from 'components/button';

import firebase from 'lib/firebase';
import 'firebase/storage';

import msgs from './msgs';
import styles from './volunteer-form.module.scss';

interface VolunteerFormProps {
  intl: IntlShape;
  aspect: Aspect;
  org?: string;
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
    UserContextValue
  > = UserContext;

  public readonly context: UserContextValue;

  private readonly headerRef: React.RefObject<HTMLHeadingElement>;

  private readonly descRef: React.RefObject<HTMLParagraphElement>;

  public constructor(props: VolunteerFormProps, context: UserContextValue) {
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
    void this.updateOrgs();
  }

  public componentDidUpdate(): void {
    void this.updateOrgs();
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

  private async updateOrgs(): Promise<void> {
    const { org } = this.props;
    if (org) {
      const {
        updateUser,
        user: { orgs, ...rest },
      } = this.context;
      const idx: number = orgs.indexOf(org);
      if (idx < 0) {
        await updateUser(new User({ ...rest, orgs: [...orgs, org] }));
      } else {
        const updated = [...orgs.slice(0, idx), org, ...orgs.slice(idx + 1)];
        await updateUser(new User({ ...rest, orgs: updated }));
      }
    }
  }

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const { user } = this.context;
    const { aspect } = this.props;
    firebase.analytics().logEvent('sign_up', {
      method: aspect === 'mentoring' ? 'mentor_form' : 'tutor_form',
    });
    this.setState(({ submittingMentor, submittingTutor }) => ({
      submittingMentor: aspect === 'mentoring' || submittingMentor,
      submittingTutor: aspect === 'tutoring' || submittingTutor,
    }));
    await signup(user);
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
    const { updateUser, user } = this.context;
    const { langs, mentoringSubjects, tutoringSubjects } = this.state;
    const msg = (message: MessageDescriptor) => intl.formatMessage(message);
    const sharedProps = {
      className: styles.formField,
      outlined: true,
    };
    const shared = (key: Extract<keyof UserInterface, keyof typeof msgs>) => ({
      ...sharedProps,
      label: msg(msgs[key]),
      onChange: (event: React.FormEvent<HTMLInputElement>) =>
        updateUser(
          new User({
            ...user,
            [key]: event.currentTarget.value,
          })
        ),
    });
    const getSocialIndex = (type: string) => {
      return user.socials.findIndex((s: SocialInterface) => s.type === type);
    };
    const getSocial = (type: SocialTypeAlias) => {
      const index: number = getSocialIndex(type);
      return index >= 0 ? user.socials[index].url : '';
    };
    const hasSocial = (type: SocialTypeAlias) => getSocialIndex(type) >= 0;
    const updateSocial = (type: SocialTypeAlias, url: string) => {
      const index: number = getSocialIndex(type);
      const socials: SocialInterface[] = Array.from(user.socials);
      if (index >= 0) {
        socials[index] = { type, url };
      } else {
        socials.push({ type, url });
      }
      return updateUser(new User({ ...user, socials }));
    };
    const s = (type: SocialTypeAlias, placeholder: (v: string) => string) => ({
      ...sharedProps,
      value: getSocial(type),
      label: msg(msgs[type]),
      onFocus: () => {
        const name: string = user.name
          ? user.name.replace(' ', '').toLowerCase()
          : 'yourname';
        if (!hasSocial(type)) {
          void updateSocial(type, placeholder(name));
        }
      },
      onChange: (event: React.FormEvent<HTMLInputElement>) => {
        return updateSocial(type, event.currentTarget.value);
      },
    });
    return (
      <>
        <TextField {...shared('name')} value={user.name} required />
        <TextField
          {...shared('email')}
          value={user.email}
          type='email'
          required
        />
        <TextField
          {...shared('phone')}
          value={user.phone ? user.phone : undefined}
          type='tel'
        />
        <PhotoInput
          {...shared('photo')}
          value={user.photo}
          onChange={(photo: string) => updateUser(new User({ ...user, photo }))}
        />
        <ListDivider className={styles.divider} />
        <LangSelect
          {...sharedProps}
          value={langs}
          values={user.langs}
          label={msg(msgs.lang)}
          onChange={(newLangs: Option<string>[]) => {
            this.setState({ langs: newLangs });
            return updateUser(
              new User({
                ...user,
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
              values={user.mentoring.subjects}
              label={msg(msgs.expertise)}
              placeholder={msg(msgs.expertisePlaceholder)}
              onChange={(subjects: Option<string>[]) => {
                this.setState({ mentoringSubjects: subjects });
                return updateUser(
                  new User({
                    ...user,
                    [aspect]: {
                      subjects: subjects.map((subject) => subject.value),
                      searches: user[aspect].searches,
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
                updateUser(
                  new User({
                    ...user,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={user.bio}
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
              values={user.tutoring.subjects}
              label={msg(msgs.subjects)}
              placeholder={msg(msgs.subjectsPlaceholder)}
              onChange={(subjects: Option<string>[]) => {
                this.setState({ tutoringSubjects: subjects });
                return updateUser(
                  new User({
                    ...user,
                    [aspect]: {
                      subjects: subjects.map((subject) => subject.value),
                      searches: user[aspect].searches,
                    },
                  })
                );
              }}
              aspect={aspect}
              required
            />
            <ScheduleInput
              {...shared('availability')}
              value={user.availability}
              onChange={(availability: Availability) =>
                updateUser(
                  new User({
                    ...user,
                    availability,
                  })
                )
              }
              required
            />
            <TextField
              {...sharedProps}
              onChange={(event) =>
                updateUser(
                  new User({
                    ...user,
                    bio: event.currentTarget.value,
                  })
                )
              }
              value={user.bio}
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
    const { user } = this.context;
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
            {!user.id && (
              <Button
                className={styles.formSubmitButton}
                label={msg(user.id ? msgs.updateSubmit : label)}
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
