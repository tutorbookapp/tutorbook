import {
  Button,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
  UserDisplay,
} from 'lib/mail/components';

import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';

export interface OrgUserTemplateProps {
  user: User;
  subjects: string[];
  langs: string[];
  org: Org;
}

export default function OrgUserTemplate({
  user,
  subjects,
  langs,
  org,
}: OrgUserTemplateProps): JSX.Element {
  const userDialogURL = `https://tutorbook.org/${org.id}/users/${user.id}`;

  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>Hi {org.name} admins,</P>
        <P>{user.name} just created a profile on Tutorbook:</P>
        <UserDisplay org={org} user={user} subjects={subjects} langs={langs} />
        <br />
        <P>
          To view {user.name}&apos;s new profile and add it to{' '}
          <Link href={`https://tutorbook.org/${org.id}/search`}>
            {org.name}&apos;s search page
          </Link>
          , simply click the button below:
        </P>
        <br />
        <Button href={userDialogURL}>VIEW PROFILE</Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P>
          <Link href={userDialogURL}>{userDialogURL}</Link>
        </P>
        <br />
        <P style={{ marginBottom: '0px !important' }}>Thank you.</P>
      </Item>
      <Footer>
        <P style={{ marginBottom: '0px !important' }}>
          If this message contains spam or unwanted messages let us know at{' '}
          <Link href='mailto:team@tutorbook.org'>team@tutorbook.org</Link>.
        </P>
      </Footer>
    </Email>
  );
}
