import { useIntl, defMsg, Msg, IntlShape } from '@tutorbook/intl';
import { Aspect, Query } from '@tutorbook/model';
import { Card } from '@rmwc/card';

import Router from 'next/router';
import QueryForm from '@tutorbook/query-form';
import Title from '@tutorbook/title';

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
  return (
    <div className={styles.hero}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <Title>{intl.formatMessage(msgs[aspect])}</Title>
        </div>
        <Card className={styles.card}>
          <QueryForm aspect={aspect} onSubmit={handleSubmit} />
        </Card>
      </div>
    </div>
  );
}
