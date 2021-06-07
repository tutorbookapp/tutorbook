import {
  Button,
  Email,
  Footer,
  Header,
  Item,
  Link,
  P,
} from 'lib/mail/components';
import { Meeting, User } from 'lib/model';
import { join } from 'lib/utils';

export interface DonationEmailProps {
  meeting: Meeting;
  people: User[];
}

export default function DonationEmail({
  meeting,
  people,
}: DonationEmailProps): JSX.Element {
  return (
    <Email>
      <Header />
      <Item left='48px' right='48px'>
        <P style={{ marginTop: '0px !important' }}>
          Hi {join(people.filter((p) => p.email).map((p) => p.firstName))},
        </P>
        <P>
          Thank you for continuing lessons with us and for your continuous
          support! If you are enjoying your lessons, we would really appreciate
          it if you would be willing to give a testimonial! If so, please{' '}
          <Link href='mailto:info@quarantuneslessons.com'>email us</Link>.
        </P>
        <P>
          This is just a reminder that every donation makes a difference. To
          donate, simply click the button below:
        </P>
        <Button href='https://donate.savethemusic.org/campaign/quarantunes/c306713'>
          DONATE NOW
        </Button>
        <br />
        <P>Or copy and paste this URL into a new tab of your browser:</P>
        <P style={{ marginBottom: '0px !important' }}>
          <Link href='https://donate.savethemusic.org/campaign/quarantunes/c306713'>
            https://donate.savethemusic.org/campaign/quarantunes/c306713
          </Link>
        </P>
        <br />
        <P>
          Thanks to your generosity, we have raised over $30,000 for the CDC
          foundation to support COVID-related efforts. We have decided to switch
          our charity to the Save the Music Foundation, a national organization
          that partners with local communities and school districts to provide
          instruments, invest in music technology, help teachers with curriculum
          and professional development, and generally support music education in
          public schools. With your help, we can give thousands of kids across
          the country exposure to music in the same way that many of our
          teachers were first able to.
        </P>
        <P>
          Thank you so much and we will keep in touch with you regarding future
          lessons.
        </P>
        <P style={{ marginBottom: '0px !important' }}>
          Best,
          <br />
          Hannah Schendel
          <br />
          QuaranTunes Team
        </P>
      </Item>
      <Footer>
        <P style={{ marginBottom: '0px !important' }}>
          If this message contains spam or unwanted messages let us know at{' '}
          <Link href='mailto:team@tutorbook.org'>team@tutorbook.org</Link>.
        </P>
      </Footer>
    </Email>
  );
}
