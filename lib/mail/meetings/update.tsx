import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default function mail(meeting: Meeting, updater: User): Promise<void> {
  const to = meeting.people.filter((p) => p.email && p.id !== updater.id);
  return send({
    to,
    cc: updater,
    subject: `${updater.firstName} updated a meeting with you`,
    template: (
      <Message>
        <P style={{ marginTop: '0' }}>Hi {join(to.map((p) => p.firstName))},</P>
        <P>{updater.name} updated a meeting with you:</P>
        <MeetingDisplay meeting={meeting} />
        <P>
          To edit or cancel this meeting, open{' '}
          <A name='Updated Meeting Calendar' href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
        </P>
        <P>
          To get in touch with {updater.firstName}, simply reply-all to this
          email or use the contact info provided above.
        </P>
        <P>Thank you.</P>
        <Footer />
      </Message>
    ),
  });
}
