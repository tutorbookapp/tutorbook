import cn from 'classnames';

import Button from 'components/button';

import styles from './contact-cta.module.scss';

export default function ContactCTA(): JSX.Element {
  return (
    <div className={cn(styles.cta, 'dark')}>
      <div className={styles.wrapper}>
        <div className={styles.prompt}>
          <h3>Student support at scale</h3>
          <p>The best way to manage tutoring and mentoring programs.</p>
        </div>
        <Button
          href='mailto:team@tutorbook.org'
          label='Contact Us'
          raised
          arrow
        />
      </div>
    </div>
  );
}
