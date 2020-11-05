import { renderToStaticMarkup } from 'react-dom/server';

import { Match, Org, User, UserWithRoles } from 'lib/model';
import DirectMatchEmail from 'lib/mail/emails/direct-match';
import { Email } from 'lib/mail/types';
import MatchEmail from 'lib/mail/emails/match';
import OrgDirectMatchEmail from 'lib/mail/emails/org-direct-match';
import OrgMatchEmail from 'lib/mail/emails/org-match';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default async function sendEmails(
  match: Match,
  people: UserWithRoles[],
  creator: UserWithRoles,
  org: Org,
  orgAdmins: User[]
): Promise<void> {
  const emails: Email[] = [];
  if (people.findIndex((p) => p.id === creator.id) < 0) {
    // Admin created match, send admin match email to all match people.
    emails.push({
      replyTo: { name: creator.name, email: creator.email },
      to: people.map((p) => ({ name: p.name, email: p.email })),
      subject: `New ${join(match.subjects)} match on Tutorbook.`,
      html: renderToStaticMarkup(
        <MatchEmail match={match} people={people} creator={creator} org={org} />
      ),
    });
    emails.push({
      to: orgAdmins.map((p) => ({ name: p.name, email: p.email })),
      subject: `New ${join(match.subjects)} match on Tutorbook.`,
      html: renderToStaticMarkup(
        <OrgMatchEmail
          match={match}
          people={people}
          creator={creator}
          org={org}
        />
      ),
    });
  } else {
    // Student created match, send request email to volunteer and confirmation
    // email to student.
    const recipient = people[people.findIndex((p) => p.id !== creator.id)];
    emails.push({
      replyTo: { name: creator.name, email: creator.email },
      to: { name: recipient.name, email: recipient.email },
      subject: `New ${join(match.subjects)} match on Tutorbook.`,
      html: renderToStaticMarkup(
        <DirectMatchEmail
          match={match}
          recipient={recipient}
          creator={creator}
        />
      ),
    });
    emails.push({
      to: orgAdmins.map((p) => ({ name: p.name, email: p.email })),
      subject: `New ${join(match.subjects)} match on Tutorbook.`,
      html: renderToStaticMarkup(
        <OrgDirectMatchEmail
          match={match}
          recipient={recipient}
          creator={creator}
          org={org}
        />
      ),
    });
  }
  await Promise.all(emails.map((email) => send(email)));
}
