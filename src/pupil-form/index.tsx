import Form from '@tutorbook/covid-form'

import { useDB } from '@tutorbook/next-firebase/db'

/**
 * React component that collects the following information from pupils and 
 * create their Firestore user document:
 * - Parent name
 * - Parent email
 * - Parent phone
 * - Name
 * - Email
 * - Subject (that they want a tutor for)
 * - Grade level
 * - Availability (when they want their tutoring appointment)
 * - Message
 */
export default function PupilForm() {
  const db = useDB();
  return <Form
    inputs={[{
      label: 'Parent name',
      el: 'textfield',
      required: true,
    }, {
      label: 'Parent email',
      type: 'email',
      el: 'textfield',
      required: true,
    }, {
      label: 'Parent phone number',
      type: 'tel',
      el: 'textfield',
    }, {
      label: 'Your name',
      el: 'textfield',
      required: true,
    }, {
      label: 'Your email',
      type: 'email',
      el: 'textfield',
    }, {
      label: 'Your grade level',
      el: 'textfield',
      required: true,
    }, {
      label: 'Subject',
      el: 'textfield',
      required: true,
    }, {
      label: 'Your availability',
      el: 'textarea',
      required: true,
    }, {
      label: 'Message',
      el: 'textarea',
    }]}
    title='Request Free Tutoring'
    description={
      'Complete the form below. Within 72 hours we will reach out to confirm ' +
      'and connect you with the latest resources! Read the FAQs for more info.'
    }
    submitLabel='Request your free tutor'
    onSubmit={(formValues) => {
      return db.collection('pupils').doc().set(formValues);
    }}
  />
}
