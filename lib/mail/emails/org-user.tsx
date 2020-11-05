import {
  Button,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
  Quote,
} from 'lib/mail/components';
import { Org, User } from 'lib/model';

export interface OrgUserEmailProps {
  user: User;
  org: Org;
}

/**
 * Email sent to org admins when a new user is created (i.e. signs-up) in their
 * org. Includes all of that user's info and a link to their `UserDialog`.
 */
export default function OrgUserEmail({
  user,
  org,
}: OrgUserEmailProps): JSX.Element {
  const userDialogURL = `https://tutorbook.app/${org.id}/people/${user.id}`;
  return (
    <Email>
      <Header />
      <Item>
        <P style={{ marginTop: '0px !important' }}>Hi {org.name} admins,</P>
        <P>{user.name} just created a profile on Tutorbook.</P>
        {!!user.bio && <Quote text={user.bio} cite={user.name} />}
        <br />
        <P>
          To view {user.name}&apos;s new profile and add it to{' '}
          <Link href={`https://tutorbook.app/${org.id}/search`}>
            {org.name}&apos;s search page
          </Link>{' '}
          simply click the button below:
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
      <Footer />
    </Email>
  );
}
