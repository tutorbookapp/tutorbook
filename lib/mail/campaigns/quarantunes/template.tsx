import {
  Button,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
} from 'lib/mail/components';

export interface QuaranTunesTemplateProps {
  name: string;
  email: string;
  link: string;
  pixel: string;
}

export default function QuaranTunesTemplate({
  name,
  email,
  link,
  pixel,
}: QuaranTunesTemplateProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>Hi {name},</P>
        <P>
          Please ignore any earlier emails from us. I made some mistakes when
          sending them (sorry about that); you should instead only pay attention
          to this one.
        </P>
        <P>
          QuaranTunes has just started using Tutorbook! You&apos;ll now be able
          to set your own availability and manage your own profile page (without
          us admins having to get involved).
        </P>
        <P>
          You&apos;re also able to specify all the languages you speak! Please
          add all your fluent languages to your profile; it&apos;ll come in
          handy as we expand QuaranTunes&apos; reach.
        </P>
        <P>
          We&apos;ve already copied your existing QuaranTunes profile into
          Tutorbook, but it&apos;s missing your availability and languages.
        </P>
        <P>
          To claim and update your profile, login with this email address (
          <b>{email}</b>) at the link below:
        </P>
        <br />
        <Button href={link}>CLAIM PROFILE</Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href={link}>{link}</Link>
        </P>
        <br />
        <P>
          Julia Segal
          <br />
          Founder of{' '}
          <Link href='https://tutorbook.org/quarantunes'>QuaranTunes</Link>
        </P>
        <img alt='' src={pixel} />
      </Item>
      <Footer>
        <P style={{ marginBottom: '0px !important' }}>
          To get in touch with us, simply reply to this email.
        </P>
      </Footer>
    </Email>
  );
}
