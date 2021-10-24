import { A, Footer, Message, P, UserDisplay } from 'lib/mail/components';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';

export interface EmailProps {
  user: User;
  org: Org;
}

export default function Email({ user, org }: EmailProps): JSX.Element {
  return (
    <Message>
      <P style={{ marginTop: '0' }}>Hi {org.name} admins,</P>
      <P>{user.name} just created <A href={`https://tutorbook.org/${org.id}/users/${user.id}`}>a profile</A> on Tutorbook:</P>
      <hr
        style={{
          border: 'none',
          borderTop: '2px solid #eaeaea',
          marginBottom: '18px',
          marginTop: '36px',
          width: '100%',
        }}
      />
      <UserDisplay user={user} orgId={org.id} />
      {user.bio && (
        <P style={{ margin: '18px 0' }}>
          <b>ABOUT</b>
          <br />
          {user.bio}
        </P>
      )}
      {user.reference && (
          <P style={{ margin: '18px 0' }}>
          <b>REFERENCE</b>
          <br />
          {user.reference}
        </P>
      )}
      {user.subjects.length && (
        <P style={{ margin: '18px 0' }}>
          <b>TEACHES</b>
          <br />
          {join(user.subjects)}
        </P>
      )}
      <hr
        style={{
          border: 'none',
          borderTop: '2px solid #eaeaea',
          marginBottom: '36px',
          marginTop: '18px',
          width: '100%',
        }}
      />
      <P>
        To add {user.firstName}’s profile to {org.name}’s search page, simply <A href={`https://tutorbook.org/${org.id}/users/${user.id}/vet`}>vet it</A> and toggle the “Visible in search results” switch on.
      </P>
      <P>Thank you.</P>
      <Footer />
    </Message>
  );
}
