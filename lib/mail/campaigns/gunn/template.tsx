import {
  Button,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
} from 'lib/mail/components';

export interface GunnTemplateProps {
  name: string;
}

export default function GunnTemplate({ name }: GunnTemplateProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>Hi {name},</P>
        <P>
          You have tutor profile at Gunn High School that hasn&apos;t been
          updated recently. Your profile will automatically be removed if you do
          not login within the next week.
        </P>
        <P>To login and update your profile, click the button below:</P>
        <br />
        <Button href='https://tutorbook.org/profile'>UPDATE PROFILE</Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href='https://tutorbook.org/profile'>
            https://tutorbook.org/profile
          </Link>
        </P>
        <br />
        <P style={{ marginBottom: '0px !important' }}>Thank you.</P>
      </Item>
      <Footer>
        <P style={{ marginBottom: '0px !important' }}>
          If you wish to get in touch with us, simply reply to this email.
        </P>
      </Footer>
    </Email>
  );
}
