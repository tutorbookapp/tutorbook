import { A, Footer, MeetingDisplay, Message, P } from 'lib/mail/components';
import { Meeting } from 'lib/model/meeting';
import { join } from 'lib/utils';

export interface EmailProps {
  meeting: Meeting;
}

export default function Email({ meeting: mtg }: EmailProps): JSX.Element {
  return (
    <Message>
      <P style={{ marginTop: '0' }}>Hi {join(mtg.people.map((p) => p.firstName))},</P>
      <P>This is just a friendly reminder of your meeting tomorrow:</P>
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
