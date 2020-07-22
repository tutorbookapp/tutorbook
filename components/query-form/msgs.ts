import { defineMessages } from 'react-intl';
import { Msg } from 'lib/intl';

export default defineMessages({
  langs: {
    id: 'query-form.langs-label',
    defaultMessage: 'What languages do you speak?',
  },
  subjects: {
    id: 'query-form.subjects-label',
    defaultMessage: 'What would you like to learn?',
  },
  tutoringSubjectsPlaceholder: {
    id: 'query-form.tutoring.subjects-placeholder',
    defaultMessage: 'Ex. Math or Science',
  },
  mentoringSubjectsPlaceholder: {
    id: 'query-form.mentoring.subjects-placeholder',
    defaultMessage: 'Ex. Computer Science or Photography',
  },
  availability: {
    id: 'query-form.tutoring.availability-label',
    defaultMessage: 'When are you available?',
  },
  checks: {
    id: 'query-form.checks-label',
    defaultMessage: 'What verifications would you like?',
  },
  orgs: {
    id: 'query-form.orgs-label',
    defaultMessage: 'Organizations',
  },
}) as Record<string, Msg>;
