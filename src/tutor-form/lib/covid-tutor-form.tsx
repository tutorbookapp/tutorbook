import React from 'react';
import {
  IntlShape,
  injectIntl,
  defineMessages,
  MessageDescriptor,
  FormattedMessage,
} from 'react-intl';
import { ListDivider } from '@rmwc/list';

import { Typography } from '@rmwc/typography';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { UserProvider } from '@tutorbook/next-firebase';
import { VerificationTypeAlias, User } from '@tutorbook/model';

import styles from './covid-tutor-form.module.scss';

const labels: Record<string, MessageDescriptor> = defineMessages({
  subjects: {
    id: 'form.subjects',
    defaultMessage: 'What can you tutor?',
    description: 'Label for the subjects-you-can-tutor field.',
  },
  availability: {
    id: 'tutor-form.availability',
    defaultMessage: 'When can you tutor?',
    description: 'Label for the when-you-can-tutor field.',
  },
  experience: {
    id: 'tutor-form.experience',
    defaultMessage: 'Education and experience',
    description: 'Label for the education and experience field.',
  },
  website: {
    id: 'tutor-form.website',
    defaultMessage: 'Your portfolio website',
    description: 'Label for the portfolio website URL field.',
  },
  linkedin: {
    id: 'tutor-form.linkedin',
    defaultMessage: 'Your LinkedIn profile',
    description: 'Label for the LinkedIn profile URL field.',
  },
  github: {
    id: 'tutor-form.github',
    defaultMessage: 'Your GitHub profile',
    description: 'Label for the GitHub profile URL field.',
  },
  facebook: {
    id: 'tutor-form.facebook',
    defaultMessage: 'Your Facebook profile',
    description: 'Label for the Facebook profile URL field.',
  },
  instagram: {
    id: 'tutor-form.instagram',
    defaultMessage: 'Your Instagram profile',
    description: 'Label for the Instagram profile URL field.',
  },
  /**
   * @todo Add integrations with the above collected social media apps to
   * ensure that the user actually owns the given profile URL.
   *linkedin: {
   *  id: 'tutor-form.linkedin',
   *  defaultMessage: 'Connect LinkedIn',
   *  description: 'Label for the "Connect LinkedIn" button.',
   *},
   *github: {
   *  id: 'tutor-form.github',
   *  defaultMessage: 'Connect GitHub',
   *  description: 'Label for the "Connect GitHub" button.',
   *},
   *facebook: {
   *  id: 'tutor-form.facebook',
   *  defaultMessage: 'Connect Facebook',
   *  description: 'Label for the "Connect Facebook" button.',
   *},
   *instagram: {
   *  id: 'tutor-form.instagram',
   *  defaultMessage: 'Connect Instagram',
   *  description: 'Label for the "Connect Instagram" button.',
   *},
   */
  submit: {
    id: 'tutor-form.submit',
    defaultMessage: 'Volunteer to tutor',
    description: 'Submit button label for the tutor sign-up form.',
  },
});

interface TutorFormState {
  readonly name: string;
  readonly linkedin: string;
  readonly github: string;
  readonly facebook: string;
  readonly instagram: string;
}

/**
 * React component that collects the following information from tutors and
 * create their Firestore user document:
 * - (name) Your name
 * - (email) Your email address
 * - (phone?) Your phone number
 * - (subjects.explicit) What can you tutor?
 * - (availability) When can you tutor?
 * - (bio) Education (e.g. "in college", "college", "masters") and experience
 *
 * @todo Add `RegExp` to validate social media account input (i.e. ensure that
 * their LinkedIn profile URL actually starts with 'https://linkedin.com/in/').
 */
class TutorForm extends React.Component<{ intl: IntlShape }> {
  public readonly state: TutorFormState = {
    name: '',
    linkedin: '',
    github: '',
    facebook: '',
    instagram: '',
  };

  public render(): JSX.Element {
    const socialsField = (id: string, placeholder: (v: string) => string) => ({
      value: (this.state as Record<string, any>)[id],
      label: this.props.intl.formatMessage(labels[id]),
      type: 'url',
      el: 'textfield' as InputElAlias,
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
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <div className={styles.formTitle}>
            <Typography use='headline2'>
              <FormattedMessage
                id='tutor-form.title'
                description='Title for the tutor/volunteer sign-up form.'
                defaultMessage='Become a Tutor'
              />
            </Typography>
          </div>
          <div className={styles.formDescription}>
            <Typography use='body1'>
              <FormattedMessage
                id='tutor-form.description'
                description='Description for the tutor/volunteer sign-up form.'
                defaultMessage={
                  'We are building a massive academic support network and ' +
                  'systems to bolster our educational infrastructure in this ' +
                  'difficult time. If you have expertise in marketing, ' +
                  'management, teaching, tech, or just want to help out we ' +
                  'would love to have you!'
                }
              />
            </Typography>
          </div>
        </div>
        <div className={styles.formWrapper}>
          <div className={styles.content}>
            <Form
              inputs={[
                {
                  label: this.props.intl.formatMessage({ id: 'form.name' }),
                  el: 'textfield' as InputElAlias,
                  required: true,
                  onChange: (event: React.FormEvent<HTMLInputElement>) => {
                    this.setState({ name: event.currentTarget.value });
                  },
                },
                {
                  label: this.props.intl.formatMessage({ id: 'form.email' }),
                  type: 'email',
                  el: 'textfield' as InputElAlias,
                  required: true,
                  key: 'email',
                },
                {
                  label: this.props.intl.formatMessage({ id: 'form.phone' }),
                  type: 'tel',
                  el: 'textfield' as InputElAlias,
                  key: 'phone',
                },
                {
                  label: this.props.intl.formatMessage(labels.subjects),
                  el: 'subjectselect' as InputElAlias,
                  required: true,
                  key: 'subjects',
                },
                {
                  label: this.props.intl.formatMessage(labels.availability),
                  el: 'scheduleinput' as InputElAlias,
                  required: true,
                  key: 'availability',
                },
                {
                  label: this.props.intl.formatMessage(labels.experience),
                  el: 'textarea' as InputElAlias,
                  required: true,
                  key: 'bio',
                },
                {
                  el: <ListDivider className={styles.divider} />,
                },
                {
                  ...socialsField('website', (v) => `https://${v}.com`),
                },
                {
                  ...socialsField(
                    'linkedin',
                    (v) => `https://linkedin.com/in/${v}`
                  ),
                },
                {
                  ...socialsField('github', (v) => `https://github.com/${v}`),
                },
                {
                  ...socialsField(
                    'facebook',
                    (v) => `https://facebook.com/${v}`
                  ),
                },
                {
                  ...socialsField(
                    'instagram',
                    (v) => `https://instagram.com/${v}`
                  ),
                },
                {
                  /**
                   * @todo Add integrations with the above collected social media apps to
                   * ensure that the user actually owns the given profile URL.
                   *}, {
                   *  el:
                   *    <Button
                   *      className={`${styles.btn} ${styles.leftBtn}`}
                   *      label={this.props.intl.formatMessage(labels.linkedin)}
                   *      raised
                   *    />,
                   *}, {
                   *  el:
                   *    <Button
                   *      className={`${styles.btn} ${styles.rightBtn}`}
                   *      label={this.props.intl.formatMessage(labels.github)}
                   *      raised
                   *    />,
                   *}, {
                   *  el:
                   *    <Button
                   *      className={`${styles.btn} ${styles.leftBtn}`}
                   *      label={this.props.intl.formatMessage(labels.facebook)}
                   *      raised
                   *    />,
                   *}, {
                   *  el:
                   *    <Button
                   *      className={`${styles.btn} ${styles.rightBtn}`}
                   *      label={this.props.intl.formatMessage(labels.instagram)}
                   *      raised
                   *    />,
                   *}, {
                   */
                  el: <ListDivider className={styles.divider} />,
                },
              ]}
              submitLabel={this.props.intl.formatMessage(labels.submit)}
              onFormSubmit={(formValues) => {
                const { name, ...socials } = this.state;
                const tutor: User = new User({
                  ...formValues,
                  name,
                  verifications: Object.entries(socials).map(([key, val]) => ({
                    type: key as VerificationTypeAlias,
                    url: val,
                  })),
                });
                return UserProvider.signup(tutor);
              }}
              loadingCheckmark
            />
          </div>
          <div className={styles.background} />
        </div>
      </div>
    );
  }
}

export default injectIntl(TutorForm);
