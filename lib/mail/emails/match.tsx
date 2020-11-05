import {
  Button,
  ContactsTable,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
  Quote,
} from 'lib/mail/components';
import { Match, Org, UserWithRoles } from 'lib/model';
import { join } from 'lib/utils';

export interface MatchEmailProps {
  org: Org;
  match: Match;
  people: UserWithRoles[];
  creator: UserWithRoles;
}

/**
 * Email sent to all people in a match (i.e. tutor and student) when an org
 * admin created a match. Includes the match subjects, message, link to a Jitsi
 * video calling room, and each person's contact info.
 * @todo Specify the appointment times here as well.
 */
export default function MatchEmail({
  org,
  match,
  people,
  creator,
}: MatchEmailProps): JSX.Element {
  const aspect = match.people.some((p) => p.roles.includes('mentor'))
    ? 'mentoring'
    : 'tutoring';

  return (
    <Email>
      <Header />
      <Item>
        <P style={{ marginTop: '0px !important' }}>
          Hi {join(people.map((p) => p.name.split(' ').shift()))},
        </P>
        <P>
          You have a new {aspect} {aspect === 'mentoring' ? 'match' : 'lesson'}{' '}
          for {join(match.subjects)}.{' '}
          {join(people.map((p) => `${p.name} is the ${join(p.roles)}`))}.
        </P>
        <P>
          Please reply to this email with when you&apos;re available to join
          your first {aspect === 'mentoring' ? 'video call' : 'lesson'}. Once
          you figure out a time when everyone&apos;s available, simply click the
          button below to join the {aspect === 'mentoring' ? 'call' : 'lesson'}:
        </P>
        <br />
        <Button href={match.venue.url}>
          JOIN {aspect === 'mentoring' ? 'CALL' : 'LESSON'}
        </Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href={match.venue.url}>{match.venue.url}</Link>
        </P>
        <br />
        <P>
          {creator.name.split(' ').shift()} from {org.name} set up this{' '}
          {aspect === 'mentoring' ? 'match' : 'lesson'}:
        </P>
        <Quote text={match.message} cite={`${creator.name} from ${org.name}`} />
        <br />
        <P>
          If this doesn&apos;t seem like a good match, please get in touch with{' '}
          {creator.name.split(' ').shift()} by using the email address listed
          below:
        </P>
        <ContactsTable contacts={[creator, ...people]} />
        <br />
        <P style={{ marginBottom: '0px !important' }}>Thank you.</P>
      </Item>
      <Footer />
    </Email>
  );
}
