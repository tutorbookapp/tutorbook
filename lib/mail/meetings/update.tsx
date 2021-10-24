import { CSSProperties, ReactNode } from 'react';
import { RRule } from 'rrule';

import { caps, getEmailLink, getPhoneLink, join } from 'lib/utils';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';

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

export interface EmailProps {
  meeting: Meeting;
  updater: User;
}

export default function Email({ meeting: mtg, updater }: EmailProps): JSX.Element {
  const recipients = mtg.people.filter((p) => p.id !== updater.id);
  const rrule = new RRule({
    ...RRule.parseString(mtg.time.recur || ''),
    dtstart: mtg.time.from,
  });
  
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
      <P style={{ marginTop: '0' }}>Hi {join(recipients.map((p) => p.firstName))},</P>
      <P>{updater.name} updated a meeting with you:</P>
      <hr
        style={{
          border: 'none',
          borderTop: '2px solid #eaeaea',
          marginBottom: '18px',
          marginTop: '36px',
          width: '100%',
        }}
      />
      <P style={{ margin: '0' }}>
        <b>WHO</b>
      </P>
      {mtg.people.map((p, idx) => (
        <table
          key={p.id}
          style={{
            borderCollapse: 'collapse',
            borderSpacing: '0',
            tableLayout: 'fixed',
            marginTop: idx === 0 ? '6px' : '8px',
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
                  href={`https://tutorbook.org/${mtg.org}/users/${p.id}`}
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
                  {p.roles.length ? `${p.name} (${join(p.roles)})` : p.name}
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
      ))}
      <P style={{ margin: '18px 0' }}>
        <b>WHEN</b>
        <br />
        {mtg.time.toString('en')}
      </P>
      <P style={{ margin: '18px 0' }}>
        <b>RECURRING</b>
        <br />
        {caps(rrule.toText())}
      </P>
      <P style={{ margin: '18px 0' }}>
        <b>WHERE</b>
        <br />
        <a
          href={mtg.venue}
          style={{
            borderRadius: '4px',
            color: '#ffffff',
            lineHeight: '36px',
            fontSize: '16px',
            textDecoration: 'none',
            backgroundColor: '#0070f3',
            display: 'inline-block',
            textAlign: 'center',
            padding: '0 16px',
            fontWeight: 600,
            marginTop: '6px',
            marginBottom: '2px',
          }}
        >
          Join video call 
        </a>
        <br />
        <a
          href={mtg.venue}
          style={{ fontSize: '16px', color: '#666666', textDecoration: 'none' }}
        >
          {mtg.venue.replace('https://', '').replace('http://', '')}
        </a>
      </P>
      <P style={{ margin: '18px 0' }}>
        <b>SUBJECTS</b>
        <br />
        {join(mtg.subjects)}
      </P>
      <P style={{ margin: '18px 0' }}>
        <b>DESCRIPTION</b>
        <br />
        {mtg.description}
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
        To edit or cancel this meeting, open{' '}
        <a style={{ color: '#0070f3' }} href='https://tutorbook.org/calendar'>
          your Tutorbook calendar
        </a>
        .
      </P>
      <P>
        To get in touch with {updater.firstName}, simply reply-all to this
        email or use the contact info provided above.
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
