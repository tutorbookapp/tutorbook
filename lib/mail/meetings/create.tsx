import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default function mail(meeting: Meeting): Promise<void> {
  const to = meeting.people.filter((p) => p.email && p.id !== meeting.creator.id);
  return send({
    to,
    cc: meeting.creator,
    subject: `${meeting.creator.firstName} booked a meeting with you`,
    template: (
      <Message>
        <P style={{ marginTop: '0' }}>Hi {join(to.map((p) => p.firstName))},</P>
        <P>{meeting.creator.name} scheduled a new meeting with you:</P>
        <MeetingDisplay meeting={meeting} />
        <P>
          To edit or cancel this meeting, open{' '}
          <A href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
        </P>
        <P>
          To get in touch with {meeting.creator.firstName}, simply reply-all to this
          email or use the contact info provided above.
        </P>
        <P>Thank you.</P>
        <Footer />
      </Message>
    ),
  });
}
