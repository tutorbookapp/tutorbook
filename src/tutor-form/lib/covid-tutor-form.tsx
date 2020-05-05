import React from 'react';
import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
} from 'react-intl';

import Form, { InputElAlias } from '@tutorbook/covid-form';
import { UserProvider } from '@tutorbook/next-firebase';
import { User } from '@tutorbook/model';

import styles from './covid-tutor-form.module.scss';

/**
 * React component that collects the following information from tutors and
 * create their Firestore user document:
 * - (name) Your name
 * - (email) Your email address
 * - (phone?) Your phone number
 * - (subjects.explicit) What can you tutor?
 * - (availability) When can you tutor?
 * - (bio) Education (e.g. "in college", "college", "masters") and experience
 */
export default function TutorForm() {
  const intl: IntlShape = useIntl();
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
    description: {
      id: 'tutor-form.description',
      defaultMessage:
        'We are building a massive academic support network and systems ' +
        'to bolster our educational infrastructure in this difficult ' +
        'time. If you have expertise in marketing, management, teaching, ' +
        'tech, or just want to help out we would love to have you!',
      description: 'Description for the tutor sign-up form.',
    },
    title: {
      id: 'tutor-form.title',
      defaultMessage: 'Become a Tutor',
      description: 'Title for the tutor sign-up form.',
    },
    submit: {
      id: 'tutor-form.submit',
      defaultMessage: 'Volunteer to tutor',
      description: 'Submit button label for the tutor sign-up form.',
    },
  });
  return (
    <div className={styles.formWrapper}>
      <div className={styles.formContent}>
        <Form
          inputs={[
            {
              label: intl.formatMessage({ id: 'form.name' }),
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'name',
            },
            {
              label: intl.formatMessage({ id: 'form.email' }),
              type: 'email',
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'email',
            },
            {
              label: intl.formatMessage({ id: 'form.phone' }),
              type: 'tel',
              el: 'textfield' as InputElAlias,
              key: 'phone',
            },
            {
              label: intl.formatMessage(labels.subjects),
              el: 'subjectselect' as InputElAlias,
              required: true,
              key: 'subjects',
            },
            {
              label: intl.formatMessage(labels.availability),
              el: 'scheduleinput' as InputElAlias,
              required: true,
              key: 'availability',
            },
            {
              label: intl.formatMessage(labels.experience),
              el: 'textarea' as InputElAlias,
              required: true,
              key: 'bio',
            },
          ]}
          title={intl.formatMessage(labels.title)}
          description={intl.formatMessage(labels.description)}
          submitLabel={intl.formatMessage(labels.submit)}
          onFormSubmit={(formValues) => {
            const tutor: User = new User(formValues);
            return UserProvider.signup(tutor);
          }}
          loadingCheckmark
        />
      </div>
    </div>
  );
}
