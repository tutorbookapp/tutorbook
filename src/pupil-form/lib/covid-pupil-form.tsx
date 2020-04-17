import Router from 'next/router';
import { DocumentReference } from '@firebase/firestore-types';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { useDB } from '@tutorbook/next-firebase/db';
import { User } from '@tutorbook/model';

import styles from './covid-pupil-form.module.scss';

// TODO: Remove this and support multiple languages and ed systems.
const GRADES: string[] = [
  'Senior',
  'Junior',
  'Sophomore',
  'Freshman',
  '8th Grade',
  '7th Grade',
  '6th Grade',
  '5th Grade',
  '4th Grade',
  '3rd Grade',
  '2nd Grade',
  '1st Grade',
  'Kindergarten',
];

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
  const db = useDB();
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
              required: true,
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
            'Complete the form below. Within 72 hours we will reach out to ' +
            'confirm and connect you with the latest resources! Read the FAQs' +
            ' for more info.'
          }
          submitLabel='Request your free tutor'
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
            const parentRef: DocumentReference = db.collection('users').doc();
            const pupil: User = new User({
              ...rest,
              parent: [parentRef.id],
            });
            const pupilRef: DocumentReference = db.collection('users').doc();
            await Promise.all([
              parentRef.set(parent.toFirestore()),
              pupilRef.set(pupil.toFirestore()),
            ]);
            Router.push(pupil.searchURL);
          }}
        />
      </div>
    </div>
  );
}
