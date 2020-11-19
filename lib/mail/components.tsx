import { CSSProperties, createContext, useContext } from 'react';

const fontFamily = [
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
const borderColor = '#dddddd';
const borderRadius = '8px';

const textStyle = {
  fontFamily,
  fontSize: '18px',
  lineHeight: '28px',
};

const quoteStyle = {
  margin: '0',
  color: '#474747',
  borderLeft: '4px solid #a6a6a6',
  padding: '0 0 0 24px',
  display: 'block',
  quotes: 'none',
};

const linkStyle = {
  ...textStyle,
  textDecoration: 'none',
  color: '#067df7 !important',
};

const buttonStyle = {
  fontFamily,
  borderRadius,
  color: '#ffffff !important',
  lineHeight: '56px',
  fontSize: '16px',
  textDecoration: 'none',
  backgroundColor: '#000000',
  display: 'inline-block',
  fontWeight: 600,
  width: '200px',
};

const dividerStyle = {
  border: 'none',
  borderTop: `1px solid ${borderColor}`,
  marginBottom: '26px',
  width: '100%',
};

const tableStyle = {
  borderCollapse: 'collapse' as CSSProperties['borderCollapse'],
  borderSpacing: '0',
  width: '100%',
};

const rowStyle = {
  padding: '0px !important',
  margin: '0px !important',
};

const paddedStyle = {
  paddingLeft: '48px',
  paddingRight: '48px',
};

const ColorContext = createContext<string>('#000000');
const useColor = () => useContext<string>(ColorContext);

interface Props {
  children: React.ReactNode;
  style?: CSSProperties;
}

export function P({ style, children }: Props): JSX.Element {
  const color = useColor();
  return <p style={{ ...textStyle, ...style, color }}>{children}</p>;
}

export function I({ style, children }: Props): JSX.Element {
  const color = useColor();
  return <i style={{ ...textStyle, ...style, color }}>{children}</i>;
}

export function Cite({ style, children }: Props): JSX.Element {
  const color = useColor();
  return <cite style={{ ...textStyle, ...style, color }}>{children}</cite>;
}

type QuoteProps = { text: string; cite: string; style?: CSSProperties };

export function Quote({ text, cite, style }: QuoteProps): JSX.Element {
  return (
    <ColorContext.Provider value={quoteStyle.color}>
      <blockquote style={{ ...quoteStyle, ...style }}>
        <P>
          <I>&quot;{text}&quot;</I>
        </P>
        <Cite>—{cite}</Cite>
      </blockquote>
    </ColorContext.Provider>
  );
}

type HrefProps = { href: string } & Props;

export function Link({ href, style, children }: HrefProps): JSX.Element {
  return (
    <a href={href} style={{ ...linkStyle, ...style }}>
      {children}
    </a>
  );
}

export function Button({ href, style, children }: HrefProps): JSX.Element {
  return (
    <table width='100%'>
      <tbody>
        <tr>
          <td align='center' style={{ padding: '0' }}>
            <div>
              <a
                href={href}
                style={{ ...buttonStyle, ...style, textAlign: 'center' }}
              >
                {children}
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

interface ContactsTableProps {
  contacts: { name: string; email: string }[];
}

export function ContactsTable({ contacts }: ContactsTableProps): JSX.Element {
  return (
    <div style={{ border: `1px solid ${borderColor}`, borderRadius }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th
              role='columnheader'
              scope='col'
              style={{
                ...textStyle,
                fontWeight: 600,
                textAlign: 'left',
                padding: '24px 0 24px 24px',
              }}
            >
              Name
            </th>
            <th
              role='columnheader'
              scope='col'
              style={{
                ...textStyle,
                fontWeight: 600,
                textAlign: 'left',
                padding: '24px',
              }}
            >
              Email
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(({ email, name }) => (
            <tr key={email} style={{ borderTop: `1px solid ${borderColor}` }}>
              <td style={{ ...textStyle, padding: '24px 0 24px 24px' }}>
                {name}
              </td>
              <td style={{ ...textStyle, padding: '24px' }}>
                <Link href={`mailto:${email}`}>{email}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ItemProps = { top?: string; bottom?: string } & Omit<Props, 'style'>;

export function Item({ top, bottom, children }: ItemProps): JSX.Element {
  return (
    <table style={tableStyle} cellPadding='0'>
      <tbody>
        <tr style={rowStyle}>
          <td style={paddedStyle}>
            <table style={tableStyle}>
              <tbody>
                <tr style={rowStyle}>
                  <td
                    style={{ paddingTop: top, paddingBottom: bottom }}
                    align='left'
                  >
                    {children}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function Header(): JSX.Element {
  return (
    <Item top='48px' bottom='48px'>
      <a
        style={{
          ...linkStyle,
          width: '64px',
          height: '64px',
          display: 'block !important',
        }}
        href='https://tutorbook.app'
        aria-label='Tutorbook'
      >
        <img
          alt=''
          src='https://tutorbook.app/favicon/favicon-96x96.png'
          width='64'
          height='64'
        />
      </a>
    </Item>
  );
}

export function Footer({ children }: Partial<Props>): JSX.Element {
  return (
    <ColorContext.Provider value='#666666'>
      <Item top='48px' bottom='48px'>
        <hr style={dividerStyle} />
        <P>
          Tutorbook - <Link href='https://tutorbook.app'>tutorbook.app</Link>
        </P>
        {children}
      </Item>
    </ColorContext.Provider>
  );
}

export function Email({ children }: Props): JSX.Element {
  return (
    <div>
      <table
        style={{
          ...tableStyle,
          display: 'table',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '580px',
          padding: 0,
          verticalAlign: 'top',
        }}
      >
        <tbody>
          <tr style={rowStyle}>
            <td>
              <div
                style={{
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  overflow: 'hidden',
                }}
              >
                {children}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
