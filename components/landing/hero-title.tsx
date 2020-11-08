import Button from 'components/button';
import Title from 'components/title';

import styles from './hero-title.module.scss';

export default function HeroTitle(): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <Title>Connect students with tutors and mentors</Title>
        <h3>
          One app to manage everything. Onboard volunteers, match students, and
          scale your organization.
        </h3>
        <div className={styles.cta}>
          <Button href='/default' label='Try it now' arrow raised />
          <Button
            href='mailto:team@tutorbook.org'
            label='Contact us'
            arrow
            outlined
          />
        </div>
      </div>
    </div>
  );
}
