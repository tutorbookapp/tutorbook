import { renderToStaticMarkup } from 'react-dom/server';

import { Org, User } from 'lib/model';
import OrgUserEmail from 'lib/mail/emails/org-user';
import send from 'lib/mail/send';

export default async function sendEmails(
  user: User,
  org: Org,
  orgAdmins: User[]
): Promise<void> {
  await send({
    to: orgAdmins.map((p) => ({ name: p.name, email: p.email })),
    subject: `${user.name} signed up on Tutorbook.`,
    html: renderToStaticMarkup(<OrgUserEmail user={user} org={org} />),
  });
}
