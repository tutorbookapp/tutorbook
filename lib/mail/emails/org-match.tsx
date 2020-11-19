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

export interface OrgMatchEmailProps {
  org: Org;
  match: Match;
  people: UserWithRoles[];
  creator: UserWithRoles;
}

/**
 * Email sent to org admins when a match is created by an org admin between
 * people who are a part of that org. Includes the match subjects, message, link
 * to a Jitsi video calling room, and each person's contact info.
 * @todo Specify the match times as well.
 */
export default function OrgMatchEmail({
  org,
  match,
  people,
  creator,
}: OrgMatchEmailProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item>
        <P style={{ marginTop: '0px !important' }}>Hi {org.name} admins,</P>
        <P>
          {creator.name} created a match for {join(match.subjects)} with{' '}
          {join(people.map((p) => `${p.name} as the ${join(p.roles)}`))}:
        </P>
        <Quote text={match.message} cite={creator.name} />
        <br />
        <P>Click the button below to view {org.name}&apos;s matches:</P>
        <br />
        <Button href={`https://tutorbook.app/${org.id}/matches`}>
          VIEW MATCHES
        </Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href={`https://tutorbook.app/${org.id}/matches`}>
            {`https://tutorbook.app/${org.id}/matches`}
          </Link>
        </P>
        <br />
        <P>
          For easy communication about this match, you can use these email
          addresses:
        </P>
        <ContactsTable contacts={people} />
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
