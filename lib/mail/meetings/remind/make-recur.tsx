import { renderToStaticMarkup } from 'react-dom/server';

import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

import ReminderTemplate from './make-recur-template';

export default async function sendMakeRecurReminderEmails(
  meeting: Meeting,
  people: User[]
): Promise<void> {
  const isTutoring = people.some((p) => p.roles.includes('tutor'));
  const noun = isTutoring ? 'tutoring lesson' : 'meeting';
  return send({
    to: people.map((p) => ({ name: p.name, email: p.email })),
    subject: `Reminder to make your ${join(
      meeting.match.subjects
    )} ${noun} recurring.`,
    html: renderToStaticMarkup(
      <ReminderTemplate meeting={meeting} people={people} />
    ),
  });
}
