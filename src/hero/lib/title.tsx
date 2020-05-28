import { useIntl, defMsg, IntlShape, Msg } from '@tutorbook/intl';
import { Aspect } from '@tutorbook/model';

import styles from './title.module.scss';

const msgs: Record<string, Msg> = defMsg({
  mentoring: {
    id: 'hero.mentoring.title',
    defaultMessage: 'Learn from and work with an expert.',
  },
  tutoring: {
    id: 'hero.tutoring.title',
    defaultMessage: 'Free tutoring amidst the coronavirus.',
  },
});

export default function Title({ aspect }: { aspect: Aspect }): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <div className={styles.wrapper}>
      <div className={styles.background}>
        <h1 className={styles.title}>{intl.formatMessage(msgs[aspect])}</h1>
      </div>
    </div>
  );
}
