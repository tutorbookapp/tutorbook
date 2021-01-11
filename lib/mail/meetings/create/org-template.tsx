import {
  Button,
  ContactsTable,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
  Quote,
} from 'lib/mail/components';
import { Meeting, Org, User } from 'lib/model';
import { join } from 'lib/utils';

export interface OrgMeetingEmailProps {
  org: Org;
  meeting: Meeting;
  people: User[];
  creator: User;
}

export default function OrgMeetingEmail({
  org,
  meeting,
  people,
  creator,
}: OrgMeetingEmailProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item>
        <P style={{ marginTop: '0px !important' }}>Hi {org.name} admins,</P>
        <P>
          {creator.name} created a match for {join(meeting.match.subjects)} with{' '}
          {join(people.map((p) => `${p.name} as the ${join(p.roles)}`))}:
        </P>
        <Quote text={meeting.match.message} cite={creator.name} />
        <br />
        <P>Click the button below to view {org.name}&apos;s matches:</P>
        <br />
        <Button href={`https://tutorbook.app/${org.id}/meetinges`}>
          VIEW MATCHES
        </Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href={`https://tutorbook.app/${org.id}/meetinges`}>
            {`https://tutorbook.app/${org.id}/meetinges`}
          </Link>
        </P>
        <br />
        <P>
          For easy communication about this match, you can use these email
          addresses:
        </P>
        <ContactsTable contacts={people} />
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
