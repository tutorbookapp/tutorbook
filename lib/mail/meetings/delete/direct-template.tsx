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
import { User } from 'lib/model/user';
import { getEmailLink, getPhoneLink, join } from 'lib/utils';

export interface DirectMeetingEmailProps {
  meeting: Meeting;
  deleter: User;
  people: User[];
}

export default function DirectMeetingEmail({
  meeting,
  deleter,
  people,
}: DirectMeetingEmailProps): JSX.Element {
  const calendarURL = 'https://tutorbook.org/calendar';
  const isTutoring = people.some((p) => p.roles.includes('tutor'));
  const recipients = people.filter((p) => p.email && p.id !== deleter.id);

  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>
          Hi {join(recipients.map((p) => p.firstName))},
        </P>
        <P>
          {deleter.name} canceled a {isTutoring ? 'tutoring lesson' : 'meeting'}{' '}
          with you:
        </P>
        <MeetingDisplay
          show='description'
          timeZone={people[0].timezone}
          meeting={meeting}
          people={people}
          sender={deleter}
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
          If this cancellation seems like a mistake, please get in touch with{' '}
          {deleter.firstName} by replying to this email or by using the
          following contact info:
        </P>
        <P>
          <Link href={getEmailLink(deleter)}>{deleter.email}</Link>
          <br />
          <Link href={getPhoneLink(deleter)}>{deleter.phone}</Link>
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
