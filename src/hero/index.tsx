import { useIntl, defMsg, Msg, IntlShape } from '@tutorbook/intl';
import { User, Aspect, Query } from '@tutorbook/model';
import { Card } from '@rmwc/card';

import React from 'react';
import Router from 'next/router';
import QueryForm from '@tutorbook/query-form';
import UserDialog from '@tutorbook/user-dialog';
import Title from '@tutorbook/title';
import Carousel from '@tutorbook/carousel';

import url from 'url';
import styles from './hero.module.scss';

function getSearchURL(query: Query): string {
  return url.format({
    pathname: '/search',
    query: {
      aspect: encodeURIComponent(query.aspect),
      subjects: encodeURIComponent(JSON.stringify(query.subjects)),
      availability: query.availability.toURLParam(),
    },
  });
}

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
  const handleSubmit: (query: Query) => any = (query: Query) =>
    Router.push(`/${intl.locale}${getSearchURL(query)}`);
  const [viewing, setViewing] = React.useState<User | undefined>();
  return (
    <div className={styles.hero}>
      <div className={styles.wrapper}>
        {viewing && (
          <UserDialog
            user={viewing}
            aspect={aspect}
            onClosed={() => setViewing(undefined)}
            subjects={viewing[aspect].subjects.slice(0, 2)}
            time={aspect === 'tutoring' ? viewing.availability[0] : undefined}
          />
        )}
        <div className={styles.title}>
          <Title>{intl.formatMessage(msgs[aspect])}</Title>
        </div>
        <Card className={styles.card}>
          <QueryForm aspect={aspect} onSubmit={handleSubmit} />
        </Card>
        <Carousel aspect={aspect} onClick={setViewing} />
      </div>
    </div>
  );
}
