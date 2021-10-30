import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default function mail(meeting: Meeting): Promise<void> {
  const to = meeting.people.filter((p) => p.email); 
  return send({
    to,
    subject: `Enjoy your ${meeting.subjects[0].name.toLowerCase()} lesson? Make it recurring`,
    template: (
      <Message name='Recur'>
        <P style={{ marginTop: '0' }}>Hi {join(to.map((p) => p.firstName))},</P>
        <P>This is just a friendly reminder to make your meeting recurring:</P>
        <MeetingDisplay meeting={meeting} />
        <P>
          To make this meeting recurring, open it in{' '}
          <A name='Calendar' href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
        </P>
        <P>
          To get in touch, simply reply-all to this email or use the contact info provided above.
        </P>
        <P>Thank you.</P>
        <Footer />
      </Message>
    ),
  });
}
