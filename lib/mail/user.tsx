import { CSSProperties, ReactNode } from 'react';

import { Org, OrgJSON } from 'lib/model/org';
import { User, UserJSON } from 'lib/model/user';
import { getEmailLink, getPhoneLink, join } from 'lib/utils';

const fontFamily = [
  '"Google Sans"',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  '"Roboto"',
  '"Oxygen"',
  '"Ubuntu"',
  '"Cantarell"',
  '"Fira Sans"',
  '"Droid Sans"',
  '"Helvetica Neue"',
  'sans-serif',
].join(',');

function P({
  style,
  children,
}: {
  style?: CSSProperties;
  children: ReactNode;
}): JSX.Element {
  return (
    <p
      style={{
        fontFamily,
        fontSize: '16px',
        lineHeight: '20px',
        margin: '8px 0',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

interface UserDisplayProps {
  orgId: string;
  user: User;
}

function UserDisplay({ user: p, orgId }: UserDisplayProps): JSX.Element {
  return (
    <table
      key={p.id}
      style={{
        borderCollapse: 'collapse',
        borderSpacing: '0',
        tableLayout: 'fixed',
        width: '100%',
      }}
    >
      <tbody>
        <tr>
          <td style={{ width: '76px', height: '64px', padding: '0' }}>
            <a
              style={{
                width: '64px',
                height: '64px',
                display: 'block',
                textDecoration: 'none',
              }}
              href={`https://tutorbook.org/${orgId}/users/${p.id}`}
            >
              <img
                style={{
                  backgroundColor: '#eaeaea',
                  borderRadius: '4px',
                }}
                src={
                  p.photo || 'https://assets.tutorbook.org/pngs/profile.png'
                }
                width='64px'
                height='64px'
                alt=''
              />
            </a>
          </td>
          <td style={{ height: '64px' }}>
            <P
              style={{
                marginTop: '0px',
                marginBottom: '0px',
                maxHeight: '28px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <a style={{ color: '#000000', textDecoration: 'none' }} href={`https://tutorbook.org/${orgId}/users/${p.id}`}>{p.roles.length ? `${p.name} (${join(p.roles)})` : p.name}</a>
            </P>
            <P
              style={{
                marginTop: '0px',
                marginBottom: '0px',
                maxHeight: '28px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#666666',
              }}
            >
              <a
                style={{ color: '#666666', textDecoration: 'none' }}
                href={getEmailLink(p)}
              >
                {p.email}
              </a>
            </P>
            <P
              style={{
                marginTop: '0px',
                marginBottom: '0px',
                maxHeight: '28px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#666666',
              }}
            >
              <a
                style={{ color: '#666666', textDecoration: 'none' }}
                href={getPhoneLink(p)}
              >
                {p.phone}
              </a>
            </P>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export interface EmailProps {
  user: User;
  org: Org;
}

export default function Email({ user, org }: EmailProps): JSX.Element {
  return (
    <div
      style={{
        maxWidth: '524px',
        margin: '0 auto',
        padding: '12px',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      <P style={{ marginTop: '0' }}>Hi {org.name} admins,</P>
      <P>{user.name} just created <a href={`https://tutorbook.org/${org.id}/users/${user.id}`}>a profile</a> on Tutorbook:</P>
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
        To add {user.firstName}’s profile to {org.name}’s search page, simply <a href={`https://tutorbook.org/${org.id}/users/${user.id}/vet`}>vet it</a> and toggle “Visible in search results” on.
      </P>
      <P>Thank you.</P>
      <div
        style={{
          marginTop: '48px',
          textAlign: 'center',
          borderRadius: '4px',
          border: '1px solid #eaeaea',
          backgroundColor: '#fafafa',
          padding: '24px',
        }}
      >
        <P style={{ color: '#666666' }}>
          <a style={{ color: '#666666' }} href='https://tutorbook.org'>
            Tutorbook
          </a>{' '}
          - Created with ✨ by{' '}
          <a style={{ color: '#666666' }} href='https://nicholaschiang.com'>
            Nicholas Chiang
          </a>
        </P>
        <P style={{ color: '#666666' }}>
          If this is spam, let me know at{' '}
          <a style={{ color: '#666666' }} href='mailto:nicholas@tutorbook.org'>
            nicholas@tutorbook.org
          </a>
        </P>
      </div>
    </div>
  );
}
