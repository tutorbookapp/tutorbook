import { renderToStaticMarkup } from 'react-dom/server';

import { getLangLabels, getSubjectLabels } from 'lib/intl/utils';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';
import send from 'lib/mail/send';

import OrgUserTemplate from './org-template';

export default async function sendEmails(
  user: User,
  org: Org,
  orgAdmins: User[]
): Promise<void> {
  const [subjects, langs] = await Promise.all([
    getSubjectLabels(user.subjects),
    getLangLabels(user.langs),
  ]);

  await send({
    to: orgAdmins.map((p) => ({ name: p.name, email: p.email })),
    subject: `${user.name} signed up on Tutorbook.`,
    html: renderToStaticMarkup(
      <OrgUserTemplate
        user={user}
        org={org}
        langs={langs}
        subjects={subjects}
      />
    ),
  });
}
