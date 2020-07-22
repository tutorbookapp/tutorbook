import { defineMessages } from 'react-intl';

export default defineMessages({
  attendees: {
    id: 'request-dialog.attendees',
    description:
      'Label for the tutoring lesson attendees field used by orgs to send ' +
      'requests on behalf of other users.',
    defaultMessage: 'Attendees',
  },
  subjects: {
    id: 'request-dialog.subjects',
    description: 'Label for the tutoring lesson subjects field.',
    defaultMessage: 'Subjects',
  },
  time: {
    id: 'request-dialog.time',
    description: 'Label for the tutoring lesson time field.',
    defaultMessage: 'Time',
  },
  timeErr: {
    id: 'request-dialog.time-err',
    description:
      "Error message telling the user that the person they're requesting" +
      " isn't available during the selected times.",
    defaultMessage: '{name} is only available {availability}.',
  },
  message: {
    id: 'request-dialog.message',
    description: 'Label for the request message field.',
    defaultMessage: 'Message',
  },
  messagePlaceholder: {
    id: 'request-dialog.message-placeholder',
    description: 'Placeholder for the request message field.',
    defaultMessage: 'I could really use your help with my {subject} project...',
  },
  submit: {
    id: 'request-dialog.submit',
    defaultMessage: 'Request {name}',
  },
  signUpAndSubmit: {
    id: 'request-dialog.sign-up-and-submit',
    defaultMessage: 'Signup and request',
  },
});
