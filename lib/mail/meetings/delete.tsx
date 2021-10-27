import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default function mail(meeting: Meeting, deleter: User): Promise<void> {
  const to = meeting.people.filter((p) => p.email && p.id !== deleter.id);
  return send({
    to,
    cc: deleter,
    subject: `${deleter.firstName} canceled a meeting with you`,
    template: (
      <Message name='Meeting Canceled'>
        <P style={{ marginTop: '0' }}>Hi {join(to.map((p) => p.firstName))},</P>
        <P>{deleter.name} canceled a meeting with you:</P>
        <MeetingDisplay meeting={meeting} />
        <P>
          To book a different meeting, open{' '}
          <A name='Calendar' href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
        </P>
        <P>
          To get in touch with {deleter.firstName}, simply reply-all to this
          email or use the contact info provided above.
        </P>
        <P>Thank you.</P>
        <Footer />
      </Message>
    ),
  });
}
