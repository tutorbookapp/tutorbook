import { A, Footer, Message, P, UserDisplay, fontFamily } from 'lib/mail/components';
import { Org } from 'lib/model/org';
import { Subject } from 'lib/model/subject';
import { User } from 'lib/model/user';
import { UsersQuery } from 'lib/model/query/users';
import { join } from 'lib/utils';
import send from 'lib/mail/send';

export default function mail(subjects: Subject[], description: string, user: User, org: Org, admins: User[]): Promise<void> {
  // TODO: This filters by the `AND` operator to see tutors who can tutor all of
  // the requested subjects but that's not necessarily what we want. Instead, we
  // want to show users who can tutor ANY of the subjects and then we can match
  // a student up with multiple different tutors for the various subjects.
  const query = new UsersQuery({ orgs: [org.id], subjects });
  return send({
    to: admins.filter((p) => p.email),
    cc: user,
    stream: 'request',
    subject: `Request - ${user.firstName} for ${join(subjects.map((s) => s.name))}`,
    template: (
      <Message name='Login'>
        <P style={{ marginTop: '0px !important' }}>Hi {org.name} admins,</P>
        <P>
          {user.name} just submitted a new tutor request:
        </P>
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
        <P style={{ margin: '18px 0' }}>
          <b>AVAILABLE</b>
          <br />
          {user.availability.toString('en')}
        </P>
        <P style={{ margin: '18px 0' }}>
          <b>NEEDS HELP WITH</b>
          <br />
          {join(subjects.map((s) => s.name))}
        </P>
        <P style={{ margin: '18px 0' }}>
          <b>SPECIFICALLY</b>
          <br />
          {description}
        </P>
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
          To find {user.firstName} a tutor, simply click the button below:
        </P>
        <br />
        <table width='100%'>
          <tbody>
            <tr>
              <td align='center' style={{ padding: '0' }}>
                <div>
                  <A
                    name='Confirm'
                    href={`https://tutorbook.org/${org.id}/users${query.query}`}
                    style={{
                      fontFamily,
                      borderRadius: '8px',
                      color: '#ffffff !important',
                      lineHeight: '56px',
                      fontSize: '16px',
                      textDecoration: 'none',
                      backgroundColor: '#000000',
                      display: 'inline-block',
                      fontWeight: 500,
                      width: '200px',
                      textAlign: 'center'
                    }}
                  >
                    SEARCH TUTORS 
                  </A>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <br />
        <P>
          To get in touch with {user.firstName}, simply reply-all to this
          email or use the contact info provided above.
        </P>
        <P>
          Thank you.
        </P>
        <Footer />
      </Message>
    ),
  });
}
