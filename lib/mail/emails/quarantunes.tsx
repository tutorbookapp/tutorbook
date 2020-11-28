import {
  Button,
  Header,
  Email,
  Footer,
  Item,
  Link,
  P,
} from 'lib/mail/components';

export interface CampaignEmailProps {
  name: string;
  email: string;
}

export default function CampaignEmail({
  name,
  email,
}: CampaignEmailProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item>
        <P style={{ marginTop: '0px !important' }}>Hi {name},</P>
        <P>
          QuaranTunes has just started using Tutorbook! You'll now be able to
          set your own availability and manage your own profile page (without us
          admins having to get involved).
        </P>
        <P>
          This email (<b>{email}</b>) already has an account; we've imported
          your Wix profile into Tutorbook.
        </P>
        <P>
          To claim your account, login with this email address (<b>{email}</b>)
          at the link below:
        </P>
        <br />
        <Button href='https://tutorbook.app/profile'>CLAIM PROFILE</Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href='https://tutorbook.app/profile'>
            {'https://tutorbook.app/profile'}
          </Link>
        </P>
        <br />
        <P>
          Julia Segal
          <br />
          Founder of{' '}
          <Link href='https://tutorbook.app/quarantunes'>QuaranTunes</Link>
        </P>
      </Item>
      <Footer>
        <P style={{ marginBottom: '0px !important' }}>
          To get in touch with us, simply reply to this email.
        </P>
      </Footer>
    </Email>
  );
}
