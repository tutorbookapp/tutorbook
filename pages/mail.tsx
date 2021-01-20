import { Org, OrgJSON, User, UserJSON } from 'lib/model';
import OrgUserTemplate from 'lib/mail/users/create/org-template';

import school from 'cypress/fixtures/orgs/school.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

export default function MailPage(): JSX.Element {
  const email = (
    <OrgUserTemplate
      user={User.fromJSON(volunteer as UserJSON)}
      org={Org.fromJSON(school as OrgJSON)}
      subjects={volunteer.mentoring.subjects}
      langs={['Spanish', 'English']}
    />
  );
  return <div style={{ padding: '24px' }}>{email}</div>;
}
