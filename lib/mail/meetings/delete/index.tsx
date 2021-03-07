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
  deleter: User,
  org: Org
): Promise<void> {
  const emails: Email[] = [];
  const isTutoring = people.some((p) => p.roles.includes('tutor'));
  const noun = isTutoring ? 'tutoring lesson' : 'meeting';
  if (people.findIndex((p) => p.id === deleter.id) < 0) {
    // Admin deleted meeting, send email to all meeting people.
    emails.push({
      replyTo: { name: deleter.name, email: deleter.email },
      to: people.map((p) => ({ name: p.name, email: p.email })),
      subject: `Canceled ${join(meeting.match.subjects)} ${noun} on Tutorbook.`,
      html: renderToStaticMarkup(
        <MeetingTemplate
          meeting={meeting}
          people={people}
          deleter={deleter}
          org={org}
        />
      ),
    });
  } else {
    // Student or volunteer deleted meeting, send email to the other person.
    // TODO: Remove assumption that there's only two people in match.
    const recipient = people[people.findIndex((p) => p.id !== deleter.id)];
    emails.push({
      replyTo: { name: deleter.name, email: deleter.email },
      to: { name: recipient.name, email: recipient.email },
      subject: `Canceled ${join(meeting.match.subjects)} ${noun} on Tutorbook.`,
      html: renderToStaticMarkup(
        <DirectMeetingTemplate
          meeting={meeting}
          recipient={recipient}
          deleter={deleter}
        />
      ),
    });
  }
  await Promise.all(emails.map((email) => send(email)));
}
