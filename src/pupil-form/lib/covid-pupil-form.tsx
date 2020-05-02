import Router from 'next/router';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { GRADES, User } from '@tutorbook/model';
import { UserProvider } from '@tutorbook/next-firebase';

import styles from './covid-pupil-form.module.scss';

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
  return (
    <div className={styles.formWrapper}>
      <div className={styles.formContent}>
        <Form
          inputs={[
            {
              label: 'Parent name',
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'parentName',
            },
            {
              label: 'Parent email',
              type: 'email',
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'parentEmail',
            },
            {
              label: 'Parent phone number',
              type: 'tel',
              el: 'textfield' as InputElAlias,
              key: 'parentPhone',
            },
            {
              label: 'Your name',
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'name',
            },
            {
              label: 'Your email',
              type: 'email',
              el: 'textfield' as InputElAlias,
              key: 'email',
            },
            {
              label: 'Your grade level',
              el: 'select' as InputElAlias,
              options: GRADES,
              key: 'bio',
            },
            {
              label: 'What would you like to learn?',
              el: 'subjectselect' as InputElAlias,
              required: true,
              key: 'searches',
            },
            {
              label: 'When are you available?',
              el: 'scheduleinput' as InputElAlias,
              required: true,
              key: 'availability',
            },
          ]}
          title='Request Free Tutoring'
          description={
            'Complete the form below to create your Tutorbook account and ' +
            "search our volunteer tutors; we'll make sure to connect you " +
            'with the support you deserve!'
          }
          submitLabel='Search volunteer tutors'
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
            const pupil: User = new User(rest);
            await UserProvider.signup(pupil, [parent]);
            Router.push(pupil.searchURL);
          }}
        />
      </div>
    </div>
  );
}
