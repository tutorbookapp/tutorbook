import { Button, Email, Footer, Header, Item, P } from 'lib/mail/components';

export interface LoginEmailProps {
  link: string;
  location: string;
}

export default function LoginEmail({
  link,
  location,
}: LoginEmailProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item>
        <P style={{ marginTop: '0px !important' }}>Hi there,</P>
        <P>
          We just received a login attempt from {location}. To complete the
          login process, simply click the button below:
        </P>
        <br />
        <Button href={link}>CONFIRM LOGIN</Button>
      </Item>
      <Footer>
        <P style={{ marginBottom: '0px !important' }}>
          If you didn&apos;t attempt to log in but received this email, or if
          the location doesn&apos;t match, please ignore this email. If you are
          concerned about your account&apos;s safety, please reply to this email
          to get in touch with us.
        </P>
      </Footer>
    </Email>
  );
}
