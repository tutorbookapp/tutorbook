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

export interface DirectMeetingEmailProps {
  meeting: Meeting;
  recipient: User;
  deleter: User;
}

export default function DirectMeetingEmail({
  meeting,
  recipient,
  deleter,
}: DirectMeetingEmailProps): JSX.Element {
  const calendarURL = 'https://tutorbook.org/calendar';
  const isTutoring = recipient.roles.includes('tutor');

  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>Hi {recipient.firstName},</P>
        <P>
          {deleter.name} canceled a {isTutoring ? 'tutoring lesson' : 'meeting'}{' '}
          with you:
        </P>
        <MeetingDisplay
          show='description'
          meeting={meeting}
          people={[deleter]}
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
          If this seems like a mistake, please get in touch with{' '}
          {deleter.firstName} by replying to this email or by using the
          following contact info:
        </P>
        <P>
          <Link href={`mailto:${deleter.email}`}>{deleter.email}</Link>
          <br />
          <Link href={`tel:${deleter.phone}`}>{deleter.phone}</Link>
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
