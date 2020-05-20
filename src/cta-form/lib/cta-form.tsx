import React from 'react';
import Router from 'next/router';
import { useIntl, IntlShape } from 'react-intl';
import Form, { InputElAlias } from '@tutorbook/form';
import { User } from '@tutorbook/model';

import firebase from '@tutorbook/firebase';

import styles from './cta-form.module.scss';

/**
 * React component that represents the primary call-to-action form (that
 * provides the information necessary to search our volunteer tutors):
 * - Optional: (grade) Your grade level
 * - (searches.explicit) What would you like to learn?
 * - (availability) When are you available?
 */
export default function CTAForm(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <Form
      inputs={[
        {
          label: intl.formatMessage({ id: 'form.searches' }),
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
      submitLabel={intl.formatMessage({ id: 'pupil-form.submit' })}
      onFormSubmit={async (formValues) => {
        firebase.analytics().logEvent('search', {
          search_term: formValues.searches.explicit.join(', '),
        });
        const pupil: User = new User(formValues);
        Router.push(`/${intl.locale}${pupil.searchURL}`);
      }}
      cardProps={{ className: styles.formCard }}
    />
  );
}
