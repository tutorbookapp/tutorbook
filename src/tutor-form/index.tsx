import Form from '@tutorbook/covid-form'

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
      label: 'Your email address',
      type: 'email',
      el: 'textfield',
    }, {
      label: 'Your name',
      el: 'textfield',
    }, {
      label: 'Your phone number',
      type: 'tel',
      el: 'textfield',
    }, {
      label: 'Education',
      el: 'textarea',
    }, {
      label: 'Experience',
      el: 'textarea',
    }, {
      label: 'Message',
      el: 'textarea',
    }]}
    submitLabel='Volunteer to tutor'
    title='Volunteer to Tutor'
    description={'We are building a massive academic support network and ' +
      'systems to bolster our educational infrastructure in this difficult ' +
      'time. If you have expertise in marketing, management, teaching, tech, ' +
      'or just want to help out we would love to have you!'} 
  />
}
