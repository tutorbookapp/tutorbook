import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

interface EmailProps {
  meeting: Meeting;
}

function Email({ meeting: mtg }: EmailProps): JSX.Element {
  const recipients = mtg.people.filter((p) => p.id !== mtg.creator.id);
  
  return (
    <Message>
      <P style={{ marginTop: '0' }}>Hi {join(recipients.map((p) => p.firstName))},</P>
      <P>{mtg.creator.name} scheduled a new meeting with you:</P>
      <MeetingDisplay meeting={mtg} />
      <P>
        To edit or cancel this meeting, open{' '}
        <A href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
      </P>
      <P>
        To get in touch with {mtg.creator.firstName}, simply reply-all to this
        email or use the contact info provided above.
      </P>
      <P>Thank you.</P>
      <Footer />
    </Message>
  );
}

export default function mail(meeting: Meeting): Promise<void> {
  return send({
    to: meeting.people.filter((p) => p.email && p.id !== meeting.creator.id),
    cc: meeting.creator,
    subject: `${meeting.creator.firstName} booked a meeting with you`,
    template: <Email meeting={meeting} />,
  });
}
