import { renderToStaticMarkup } from 'react-dom/server';

import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

import ReminderTemplate from './template';

// TODO: Should we send separate reminder emails? If there are a lot of matches
// between people in different timezones, we definitely should (so each person
// can see the meeting time in their local timezone and won't be confused).
export default async function sendEmails(
  meeting: Meeting,
  people: User[]
): Promise<void> {
  const isTutoring = people.some((p) => p.roles.includes('tutor'));
  const noun = isTutoring ? 'tutoring lesson' : 'meeting';
  const date = meeting.time.toString('en', people[0].timezone);
  return send({
    to: people.map((p) => ({ name: p.name, email: p.email })),
    subject: `Reminder: ${join(meeting.match.subjects)} ${noun} on ${date}.`,
    html: renderToStaticMarkup(
      <ReminderTemplate meeting={meeting} people={people} />
    ),
  });
}
