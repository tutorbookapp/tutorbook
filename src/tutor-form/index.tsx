import Form from '@tutorbook/covid-form'

import firebase from '@tutorbook/next-firebase'

/**
 * React component that collects the following information from tutors and 
 * create their Firestore user document:
 * - Email
 * - Name
 * - Phone
 * - Education (e.g. "in college", "college", "masters", "pHD")
 * - Do you have experience tutoring professionally?
 * - If so, how many years have you been tutoring?
 * - School (text field)
 * - Hobbies
 * - Message
 */
export default function TutorForm() {
  return <Form
    inputs={[{
      label: 'Your name',
      el: 'textfield',
      required: true,
    }, {
      label: 'Your email address',
      type: 'email',
      el: 'textfield',
      required: true,
    }, {
      label: 'Your phone number',
      type: 'tel',
      el: 'textfield',
    }, {
      label: 'Education',
      el: 'textarea',
      required: true,
    }, {
      label: 'Experience',
      el: 'textarea',
      required: true,
    }, {
      label: 'Message',
      el: 'textarea',
    }]}
    title='Volunteer as a Tutor'
    description={
      'We are building a massive academic support network and systems to ' +
      'bolster our educational infrastructure in this difficult time. If you ' +
      'have expertise in marketing, management, teaching, tech, or just want ' +
      'to help out we would love to have you!'
    } 
    submitLabel='Volunteer to tutor'
    onSubmit={(formValues) => new Promise((res, rej) => {})}
  />
}
