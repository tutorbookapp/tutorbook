import { CSSProperties, ReactNode } from 'react';
import { RRule } from 'rrule';

import { caps, getEmailLink, getPhoneLink, join } from 'lib/utils';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';

export const fontFamily = [
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

export interface AProps {
  href: string;
  children: ReactNode;
}

export function A({ href, children }: AProps): JSX.Element {
  return <a style={{ color: '#0070f3' }} href={href}>{children}</a>;
}

export interface PProps {
  style?: CSSProperties;
  children: ReactNode;
}

export function P({ style, children }: PProps): JSX.Element {
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

export interface UserDisplayProps {
  style?: CSSProperties;
  orgId: string;
  user: User;
}

export function UserDisplay({ style, user: p, orgId }: UserDisplayProps): JSX.Element {
  return (
    <table
      key={p.id}
      style={{
        borderCollapse: 'collapse',
        borderSpacing: '0',
        tableLayout: 'fixed',
        width: '100%',
        ...style,
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

export interface MeetingDisplayProps {
  meeting: Meeting;
}

export function MeetingDisplay({ meeting: mtg }: MeetingDisplayProps): JSX.Element {
  const rrule = new RRule({
    ...RRule.parseString(mtg.time.recur || ''),
    dtstart: mtg.time.from,
  });

  return (
    <>
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
        <UserDisplay user={p} orgId={mtg.org} style={{ marginTop: idx === 0 ? '6px' : '8px' }} />
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
          Join meeting 
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
    </>
  );
}

export interface FooterProps {
  children?: ReactNode;
}

export function Footer({ children }: FooterProps): JSX.Element {
  return (
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
      {children}
    </div>
  );
}

export interface MessageProps {
  children: ReactNode;
}

export function Message({ children }: MessageProps): JSX.Element {
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
      {children}
    </div>
  );
}
