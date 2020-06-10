import { useIntl, defMsg, Msg, IntlShape } from '@tutorbook/intl';
import { User, Aspect } from '@tutorbook/model';
import { Card } from '@rmwc/card';

import React from 'react';
import UserDialog from '@tutorbook/user-dialog';
import Title from '@tutorbook/title';
import Carousel from '@tutorbook/carousel';
import SearchForm from './search-form';

import styles from './hero.module.scss';

const msgs: Record<string, Msg> = defMsg({
  mentoring: {
    id: 'hero.mentoring.title',
    defaultMessage: 'Learn from and work with an expert.',
  },
  tutoring: {
    id: 'hero.tutoring.title',
    defaultMessage: 'Free tutoring amidst COVID-19.',
  },
});

export default function Hero({ aspect }: { aspect: Aspect }): JSX.Element {
  const intl: IntlShape = useIntl();
  const [viewing, setViewing] = React.useState<User | undefined>();
  return (
    <div className={styles.hero}>
      <div className={styles.wrapper}>
        {viewing && (
          <UserDialog
            user={viewing}
            aspect={aspect}
            onClosed={() => setViewing(undefined)}
            subjects={[]}
            time={aspect === 'tutoring' ? viewing.availability[0] : undefined}
          />
        )}
        <div className={styles.title}>
          <Title>{intl.formatMessage(msgs[aspect])}</Title>
        </div>
        <Card className={styles.card}>
          <SearchForm aspect={aspect} />
        </Card>
        <Carousel aspect={aspect} onClick={setViewing} />
      </div>
    </div>
  );
}
