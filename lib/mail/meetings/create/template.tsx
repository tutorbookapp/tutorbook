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
import { Meeting, Org, User } from 'lib/model';
import { join } from 'lib/utils';

export interface MeetingEmailProps {
  org: Org;
  meeting: Meeting;
  people: User[];
  creator: User;
}

export default function MeetingEmail({
  org,
  meeting,
  people,
  creator,
}: MeetingEmailProps): JSX.Element {
  const calendarURL = 'https://tutorbook.app/calendar';
  const isTutoring = people.some((p) => p.roles.includes('tutor'));

  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>
          Hi {join(people.map((p) => p.firstName))},
        </P>
        <P>
          {creator.name} from {org.name} just scheduled a new{' '}
          {isTutoring ? 'tutoring lesson' : 'mentoring meeting'} between{' '}
          {people.length > 2 ? 'all' : 'both'} of you:
        </P>
        <MeetingDisplay
          meeting={meeting}
          people={people}
          creator={creator}
          org={org}
        />
        <br />
        <P>
          To view and edit your {isTutoring ? 'lessons' : 'meetings'}, simply
          click the button below:
        </P>
        <br />
        <Button href={calendarURL}>VIEW CALENDAR</Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href={calendarURL}>{calendarURL}</Link>
        </P>
        <br />
        <P>
          If you&apos;re unable to attend or if this doesn&apos;t seem like a
          good match, please get in touch with {creator.firstName} by replying
          to this email or by using the following contact info:
        </P>
        <P>
          <Link href={`mailto:${creator.email}`}>{creator.email}</Link>
          <br />
          <Link href={`tel:${creator.phone}`}>{creator.phone}</Link>
        </P>
        <br />
        <P style={{ marginBottom: '0px !important' }}>Thank you.</P>
      </Item>
      <Footer>
        <P>
          This email was sent to you because you have a profile on Tutorbook.
          You can edit or remove your profile{' '}
          <Link href='https://tutorbook.app/profile'>here</Link>.
        </P>
        <P style={{ marginBottom: '0px !important' }}>
          If this message contains spam or unwanted messages let us know at{' '}
          <Link href='mailto:team@tutorbook.org'>team@tutorbook.org</Link>.
        </P>
      </Footer>
    </Email>
  );
}
