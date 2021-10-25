import { A, Footer, Message, P, UserDisplay } from 'lib/mail/components';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default function mail(user: User, org: Org, admins: User[]): Promise<void> {
  return send({
    to: admins.filter((p) => p.email),
    subject: `${user.firstName} signed up on Tutorbook`,
    template: (
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
          To add {user.firstName}’s profile to <A href={`https://tutorbook.org/${org.id}/search`}>{org.name}’s search page</A>, simply open <A href={`https://tutorbook.org/${org.id}/users/${user.id}/vet`}>this vetting page</A> and toggle the “Visible in search results” switch on.
        </P>
        <P>Thank you.</P>
        <Footer />
      </Message>
    ),
  });
}
