import { defineMessages } from 'react-intl';
import { useIntl, Msg, IntlShape } from 'lib/intl';
import { UsersQuery, User, Aspect } from 'lib/model';
import { Card } from '@rmwc/card';

import React, { useMemo, useState, useCallback } from 'react';
import RequestDialog from 'components/request-dialog';
import Carousel from 'components/carousel';
import Title from 'components/title';
import SearchForm from './search-form';

import styles from './hero.module.scss';

const msgs: Record<string, Msg> = defineMessages({
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
  const [viewing, setViewing] = useState<User | undefined>();
  const onClosed = useCallback(() => setViewing(undefined), []);
  const subjects = useMemo(() => [], []);
  return (
    <div className={styles.hero}>
      <div className={styles.wrapper}>
        {!!viewing && (
          <RequestDialog
            user={viewing}
            aspect={aspect}
            onClosed={onClosed}
            subjects={subjects}
          />
        )}
        <div className={styles.title}>
          <Title>{intl.formatMessage(msgs[aspect])}</Title>
        </div>
        <Card className={styles.card}>
          <SearchForm aspect={aspect} />
        </Card>
        <Carousel query={new UsersQuery({ aspect })} onClick={setViewing} />
      </div>
    </div>
  );
}
