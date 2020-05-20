import CTAForm from '@tutorbook/cta-form';
import Checkmarks from '@tutorbook/checkmarks';

import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
  FormattedMessage,
} from 'react-intl';

import styles from './cta-block.module.scss';

const labels: Record<string, MessageDescriptor> = defineMessages({
  safeguarding: {
    id: 'cta-block.safeguarding',
    defaultMessage: 'Safeguarding',
  },
  lessonRecordingsAndMore: {
    id: 'cta-block.lesson-recordings',
    defaultMessage: 'Lesson recordings and more',
  },
});

export default function CTABlock(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <div className={styles.ctaBlock}>
      <div className={styles.ctaBlockContent}>
        <div className={styles.ctaBlockBackground}>
          <div className={styles.ctaBlockTextContainer}>
            <p className={styles.ctaBlockHeading}>
              <FormattedMessage
                id='cta-block.title'
                defaultMessage='Find your tutor'
              />
            </p>
            <div className={styles.ctaBlockSubheading}>
              <FormattedMessage
                id='cta-block.body'
                defaultMessage={
                  'Ready to supercharge your academics? Complete this form to' +
                  ' search our free, volunteer tutors.'
                }
              />
            </div>
          </div>
          <div className={styles.ctaBlockForm}>
            <CTAForm />
            <div className={styles.ctaBlockCheckmarks}>
              <Checkmarks
                labels={[
                  intl.formatMessage(labels.safeguarding),
                  intl.formatMessage(labels.lessonRecordingsAndMore),
                ]}
                white
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
