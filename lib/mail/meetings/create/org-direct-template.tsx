import {
  Button,
  Email,
  Footer,
  Header,
  Item,
  Link,
  MeetingDisplay,
  P,
} from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';

export interface OrgDirectMeetingEmailProps {
  org: Org;
  meeting: Meeting;
  recipient: User;
  creator: User;
  people: User[];
}

export default function OrgDirectMeetingEmail({
  org,
  meeting,
  recipient,
  creator,
  people,
}: OrgDirectMeetingEmailProps): JSX.Element {
  const calendarURL = `https://tutorbook.org/${org.id}/calendar`;
  const isTutoring = recipient.roles.includes('tutor');

  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>Hi {org.name} admins,</P>
        <P>
          {creator.name} scheduled a new{' '}
          {isTutoring ? 'tutoring lesson' : 'meeting'} with {recipient.name}:
        </P>
        <MeetingDisplay
          show='message'
          timeZone={creator.timezone}
          meeting={meeting}
          people={people}
          sender={creator}
        />
        <br />
        <P>
          To view and edit {org.name}&apos;s{' '}
          {isTutoring ? 'lessons' : 'meetings'}, simply click the button below:
        </P>
        <br />
        <Button href={calendarURL}>VIEW CALENDAR</Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href={calendarURL}>{calendarURL}</Link>
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
