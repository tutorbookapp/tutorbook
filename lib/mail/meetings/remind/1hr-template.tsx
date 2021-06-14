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
import { Meeting, User } from 'lib/model';
import { join } from 'lib/utils';

export interface ReminderEmailProps {
  meeting: Meeting;
  people: User[];
}

export default function ReminderEmail({
  meeting,
  people,
}: ReminderEmailProps): JSX.Element {
  const calendarURL = 'https://tutorbook.org/calendar';
  const isTutoring = people.some((p) => p.roles.includes('tutor'));

  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>
          Hi {join(people.filter((p) => p.email).map((p) => p.firstName))},
        </P>
        <P>
          This is just a friendly reminder of your{' '}
          {isTutoring ? 'tutoring lesson' : 'meeting'} in an hour:
        </P>
        <MeetingDisplay
          show='description'
          timeZone={people[0].timezone}
          sender={people[0]}
          meeting={meeting}
          people={people}
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
          If you&apos;re unable to attend or if this reminder seems like a
          mistake, please get in touch by using the contact info above.
        </P>
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
