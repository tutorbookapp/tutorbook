import React from 'react';
import Router from 'next/router';
import {
  useIntl,
  defineMessages,
  IntlShape,
  MessageDescriptor,
} from 'react-intl';
import Form, { InputElAlias } from '@tutorbook/form';
import { User } from '@tutorbook/model';

import firebase from '@tutorbook/firebase';

import styles from './cta-forms.module.scss';

interface FormProps {
  readonly horizontal?: boolean;
  readonly style?: Record<string, string>;
}

const msgs: Record<string, MessageDescriptor> = defineMessages({
  mentorFormSubmit: {
    id: 'cta-forms.mentoring.submit',
    defaultMessage: 'Search mentors',
    description: 'Label for the mentoring CTA form submit button.',
  },
  tutorFormSubmit: {
    id: 'cta-forms.tutoring.submit',
    defaultMessage: 'Search tutors',
    description: 'Label for the tutoring CTA form submit button.',
  },
});

export function MentoringForm(props: FormProps): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <Form
      inputs={[
        {
          label: intl.formatMessage({ id: 'form.searches' }),
          placeholder: intl.formatMessage({ id: 'form.expertise-placeholder' }),
          el: 'subjectselect' as InputElAlias,
          searchIndex: 'expertise',
          required: true,
          key: 'searches',
        },
      ]}
      submitLabel={intl.formatMessage(msgs.mentorFormSubmit)}
      onFormSubmit={async (formValues) => {
        firebase.analytics().logEvent('search', {
          search_term: formValues.searches.join(', '),
        });
        const pupil: User = new User(formValues);
        Router.push(`/${intl.locale}${pupil.searchURL}`);
      }}
      cardProps={{ className: styles.formCard }}
      horizontal={props.horizontal}
      style={props.style}
    />
  );
}

/**
 * React component that represents the primary call-to-action form (that
 * provides the information necessary to search our volunteer tutors):
 * - Optional: (grade) Your grade level
 * - (searches) What would you like to learn?
 * - (availability) When are you available?
 */
export function TutoringForm(props: FormProps): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <Form
      inputs={[
        {
          label: intl.formatMessage({ id: 'form.searches' }),
          placeholder: intl.formatMessage({ id: 'form.subjects-placeholder' }),
          el: 'subjectselect' as InputElAlias,
          required: true,
          key: 'searches',
        },
        {
          label: intl.formatMessage({ id: 'form.availability' }),
          el: 'scheduleinput' as InputElAlias,
          required: true,
          key: 'availability',
        },
      ]}
      submitLabel={intl.formatMessage(msgs.tutorFormSubmit)}
      onFormSubmit={async (formValues) => {
        firebase.analytics().logEvent('search', {
          search_term: formValues.searches.join(', '),
        });
        const pupil: User = new User(formValues);
        Router.push(`/${intl.locale}${pupil.searchURL}`);
      }}
      cardProps={{ className: styles.formCard }}
      horizontal={props.horizontal}
      style={props.style}
    />
  );
}
