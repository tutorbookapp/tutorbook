import React from 'react';
import Router from 'next/router';
import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
  FormattedMessage,
} from 'react-intl';

import { Typography } from '@rmwc/typography';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { GRADES, GradeAlias, User } from '@tutorbook/model';
import { UserProvider } from '@tutorbook/next-firebase';

import styles from './pupil-form.module.scss';

const labels: Record<string, MessageDescriptor> = defineMessages({
  parentName: {
    id: 'pupil-form.parentName',
    defaultMessage: 'Parent name',
    description: 'Label for the parent name field.',
  },
  parentEmail: {
    id: 'pupil-form.parentEmail',
    defaultMessage: 'Parent email',
    description: 'Label for the parent email field.',
  },
  parentPhone: {
    id: 'pupil-form.parentPhone',
    defaultMessage: 'Parent phone number',
    description: 'Label for the parent phone number field.',
  },
  name: {
    id: 'form.name',
    defaultMessage: 'Your name',
    description: 'Label for the name field.',
  },
  email: {
    id: 'form.email',
    defaultMessage: 'Your email address',
    description: 'Label for the email address field.',
  },
  phone: {
    id: 'form.phone',
    defaultMessage: 'Your phone number',
    description: 'Label for the phone number field.',
  },
  grade: {
    id: 'form.grade',
    defaultMessage: 'Your grade level',
    description: 'Label for the grade level field.',
  },
  searches: {
    id: 'form.searches',
    defaultMessage: 'What would you like to learn?',
    description: 'Label for the subjects-to-search field.',
  },
  availability: {
    id: 'form.availability',
    defaultMessage: 'When are you available?',
    description: 'Label for the availability field.',
  },
  submit: {
    id: 'pupil-form.submit',
    defaultMessage: 'Search volunteer tutors',
    description: 'Submit button label for the pupil sign-up form.',
  },
});

/**
 * React component that collects the following information from pupils and
 * create their Firestore user document:
 * - (parent.name) Parent name
 * - (parent.email) Parent email
 * - (parent.phone?) Parent phone
 * - (name) Your name
 * - (email?) Your email
 * - (bio) Your grade level
 * - (searches.explicit) What would you like to learn?
 * - (availability) When are you available?
 */
export default function PupilForm() {
  const intl: IntlShape = useIntl();
  const [grade, setGrade] = React.useState<GradeAlias | undefined>();
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.formTitle}>
          <Typography use='headline2'>
            <FormattedMessage
              id='pupil-form.title'
              description='Title for the pupil sign-up form.'
              defaultMessage='Request Free Tutoring'
            />
          </Typography>
        </div>
        <div className={styles.formDescription}>
          <Typography use='body1'>
            <FormattedMessage
              id='pupil-form.description'
              description='Description for the pupil sign-up form.'
              defaultMessage={
                'Complete the form below to create your Tutorbook account ' +
                "and search our volunteer tutors; we'll make sure to connect " +
                'you with the support you deserve!'
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
                label: intl.formatMessage(labels.parentName),
                el: 'textfield' as InputElAlias,
                required: true,
                key: 'parentName',
              },
              {
                label: intl.formatMessage(labels.parentEmail),
                type: 'email',
                el: 'textfield' as InputElAlias,
                required: true,
                key: 'parentEmail',
              },
              {
                label: intl.formatMessage(labels.parentPhone),
                type: 'tel',
                el: 'textfield' as InputElAlias,
                key: 'parentPhone',
              },
              {
                label: intl.formatMessage(labels.name),
                el: 'textfield' as InputElAlias,
                required: true,
                key: 'name',
              },
              {
                label: intl.formatMessage(labels.email),
                type: 'email',
                el: 'textfield' as InputElAlias,
                required: true,
                key: 'email',
              },
              {
                label: intl.formatMessage(labels.grade),
                el: 'select' as InputElAlias,
                options: GRADES,
                onChange: (event: React.FormEvent<HTMLSelectElement>) => {
                  const gradeString: string = event.currentTarget.value;
                  setGrade(new Number(gradeString).valueOf() as GradeAlias);
                },
              },
              {
                label: intl.formatMessage(labels.searches),
                el: 'subjectselect' as InputElAlias,
                required: true,
                key: 'searches',
                grade,
              },
              {
                label: intl.formatMessage(labels.availability),
                el: 'scheduleinput' as InputElAlias,
                required: true,
                key: 'availability',
              },
            ]}
            submitLabel={intl.formatMessage(labels.submit)}
            onFormSubmit={async (formValues) => {
              const {
                parentName,
                parentEmail,
                parentPhone,
                ...rest
              } = formValues;
              const parent: User = new User({
                name: parentName,
                email: parentEmail,
                phone: parentPhone,
              });
              const pupil: User = new User({ ...rest, grade });
              await UserProvider.signup(pupil, [parent]);
              Router.push(`/${intl.locale}${pupil.searchURL}`);
            }}
          />
        </div>
        <div className={styles.background} />
      </div>
    </div>
  );
}
