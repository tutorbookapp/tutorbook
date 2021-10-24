import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

interface EmailProps {
  meeting: Meeting;
}

function Email({ meeting: mtg }: EmailProps): JSX.Element {
  return (
    <Message>
      <P style={{ marginTop: '0' }}>Hi {join(mtg.people.map((p) => p.firstName))},</P>
      <P>This is just a friendly reminder of your meeting in an hour:</P>
      <MeetingDisplay meeting={mtg} />
      <P>
        To edit or cancel this meeting, open{' '}
        <A href='https://tutorbook.org/calendar'>your Tutorbook calendar</A>.
      </P>
      <P>
        To get in touch, simply reply-all to this email or use the contact info provided above.
      </P>
      <P>Thank you.</P>
      <Footer />
    </Message>
  );
}

export default function mail(meeting: Meeting): Promise<void> {
  return send({
    to: meeting.people.filter((p) => p.email),
    subject: `You’ve got a ${meeting.subjects[0]} lesson today!`,
    template: <Email meeting={meeting} />,
  });
}
