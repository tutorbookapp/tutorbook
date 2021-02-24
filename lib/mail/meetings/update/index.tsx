import { renderToStaticMarkup } from 'react-dom/server';

import { Meeting, Org, User } from 'lib/model';
import { Email } from 'lib/mail/types';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

import DirectMeetingTemplate from './direct-template';
import MeetingTemplate from './template';

export default async function sendEmails(
  meeting: Meeting,
  people: User[],
  updater: User,
  org: Org
): Promise<void> {
  const emails: Email[] = [];
  const isTutoring = people.some((p) => p.roles.includes('tutor'));
  const noun = isTutoring ? 'tutoring lesson' : 'mentoring meeting';
  if (people.findIndex((p) => p.id === updater.id) < 0) {
    // Admin updated meeting, send email to all meeting people.
    emails.push({
      replyTo: { name: updater.name, email: updater.email },
      to: people.map((p) => ({ name: p.name, email: p.email })),
      subject: `Updated ${join(meeting.match.subjects)} ${noun} on Tutorbook.`,
      html: renderToStaticMarkup(
        <MeetingTemplate
          meeting={meeting}
          people={people}
          updater={updater}
          org={org}
        />
      ),
    });
  } else {
    // Student or volunteer updated meeting, send email to the other person.
    // TODO: Remove assumption that there's only two people in match.
    const recipient = people[people.findIndex((p) => p.id !== updater.id)];
    emails.push({
      replyTo: { name: updater.name, email: updater.email },
      to: { name: recipient.name, email: recipient.email },
      subject: `Updated ${join(meeting.match.subjects)} ${noun} on Tutorbook.`,
      html: renderToStaticMarkup(
        <DirectMeetingTemplate
          meeting={meeting}
          recipient={recipient}
          updater={updater}
        />
      ),
    });
  }
  await Promise.all(emails.map((email) => send(email)));
}
