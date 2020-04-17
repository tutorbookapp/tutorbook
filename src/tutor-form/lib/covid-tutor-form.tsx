import Form, { InputElAlias } from '@tutorbook/covid-form';
import { useDB } from '@tutorbook/next-firebase/db';
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
  const db = useDB();
  return (
    <div className={styles.formWrapper}>
      <div className={styles.formContent}>
        <Form
          inputs={[
            {
              label: 'Your name',
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'name',
            },
            {
              label: 'Your email address',
              type: 'email',
              el: 'textfield' as InputElAlias,
              required: true,
              key: 'email',
            },
            {
              label: 'Your phone number',
              type: 'tel',
              el: 'textfield' as InputElAlias,
              key: 'phone',
            },
            {
              label: 'What can you tutor?',
              el: 'subjectselect' as InputElAlias,
              required: true,
              key: 'subjects',
            },
            {
              label: 'When can you tutor?',
              el: 'scheduleinput' as InputElAlias,
              required: true,
              key: 'availability',
            },
            {
              label: 'Education and experience',
              el: 'textarea' as InputElAlias,
              required: true,
              key: 'bio',
            },
          ]}
          title='Become a Tutor'
          description={
            'We are building a massive academic support network and systems ' +
            'to bolster our educational infrastructure in this difficult ' +
            'time. If you have expertise in marketing, management, teaching, ' +
            'tech, or just want to help out we would love to have you!'
          }
          submitLabel='Volunteer to tutor'
          onFormSubmit={(formValues) => {
            const tutor: User = new User(formValues);
            return db.collection('users').doc().set(tutor.toFirestore());
          }}
          loadingCheckmark
        />
      </div>
    </div>
  );
}
