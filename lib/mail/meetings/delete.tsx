import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

interface EmailProps {
  meeting: Meeting;
  deleter: User;
}

function Email({ meeting: mtg, deleter }: EmailProps): JSX.Element {
  const recipients = mtg.people.filter((p) => p.id !== deleter.id);
  
  return (
    <Message>
      <P style={{ marginTop: '0' }}>Hi {join(recipients.map((p) => p.firstName))},</P>
      <P>{deleter.name} canceled a meeting with you:</P>
      <MeetingDisplay meeting={mtg} />
      <P>
        To book a different meeting, open{' '}
        <A href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
      </P>
      <P>
        To get in touch with {deleter.firstName}, simply reply-all to this
        email or use the contact info provided above.
      </P>
      <P>Thank you.</P>
      <Footer />
    </Message>
  );
}

export default function mail(meeting: Meeting, deleter: User): Promise<void> {
  return send({
    to: meeting.people.filter((p) => p.email && p.id !== deleter.id),
    cc: deleter,
    subject: `${deleter.firstName} canceled a meeting with you`,
    template: <Email meeting={meeting} deleter={deleter} />,
  });
}
