import CTAForm from '@tutorbook/cta-form';
import Checkmarks from '@tutorbook/checkmarks';

import styles from './cta-block.module.scss';

export default function CTABlock(): JSX.Element {
  return (
    <div className={styles.ctaBlock}>
      <div className={styles.ctaBlockContent}>
        <div className={styles.ctaBlockBackground}>
          <div className={styles.ctaBlockTextContainer}>
            <p className={styles.ctaBlockHeading}>Find your tutor</p>
            <div className={styles.ctaBlockSubheading}>
              Ready to supercharge your academics? Complete this form to search
              our free, volunteer tutors.
            </div>
          </div>
          <div className={styles.ctaBlockForm}>
            <CTAForm />
            <Checkmarks
              labels={['Safeguarding', 'Lesson recordings and more']}
              white
            />
          </div>
        </div>
      </div>
    </div>
  );
}
