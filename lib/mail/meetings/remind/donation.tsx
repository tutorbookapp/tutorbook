import { renderToStaticMarkup } from 'react-dom/server';

import { Role, User } from 'lib/model/user';
import { Meeting } from 'lib/model/meeting';
import send from 'lib/mail/send';

import ReminderTemplate from './donation-template';

export default async function sendDonationReminderEmails(
  meeting: Meeting,
  people: User[]
): Promise<void> {
  const students = people.filter((p) =>
    ['tutee', 'parent'].some((r) => p.roles.includes(r as Role))
  );
  const volunteer = people.filter((p) =>
    ['tutor'].some((r) => p.roles.includes(r as Role))
  )[0];
  return send({
    to: students.map((p) => ({ name: p.name, email: p.email })),
    subject: 'Thank you for your continuous support!',
    html: renderToStaticMarkup(
      <ReminderTemplate
        meeting={meeting}
        students={students}
        volunteer={volunteer}
      />
    ),
  });
}
