import cn from 'classnames';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { GraphProps } from 'components/analytics/graph';
import Header from 'components/header';

import { useOrg } from 'lib/context/org';

import fallback from './fallback';
import styles from './analytics.module.scss';

const Graph = dynamic<GraphProps>(() => import('components/analytics/graph'));

interface LabelProps {
  percent: number;
  positive?: boolean;
  negative?: boolean;
}

function Label({ percent }: LabelProps): JSX.Element {
  return (
    <span
      className={cn(styles.label, {
        [styles.positive]: percent > 0,
        [styles.negative]: percent <= 0,
      })}
    >
      {`${percent > 0 ? '+' : ''}${percent}%`}
    </span>
  );
}

export default function Analytics(): JSX.Element {
  const { org } = useOrg();
  const { t } = useTranslation();
  const { data } = useSWR<AnalyticsRes>(
    org?.id ? `/api/orgs/${org.id}/analytics` : null
  );

  const nums = useMemo(() => data || fallback, [data]);

  // TODO: Ensure that the scale on the chart isn't dependent on the data points
  // being equally spaced out. Instead, it should be relative to the data point
  // `date` value.
  // @see {@link http://recharts.org/en-US/api/XAxis#scale}
  return (
    <>
      <Header
        header={t('common:overview')}
        body={t('overview:subtitle', { name: org ? `${org.name}'s` : 'your' })}
      />
      <div className={styles.wrapper}>
        <dl className={styles.numbers}>
          <div className={styles.number}>
            <dt>
              Volunteers
              <Label percent={nums.volunteers.change} />
            </dt>
            <dd>{nums.volunteers.total}</dd>
            <div>{nums.volunteers.matched} Matched</div>
          </div>
          <div className={styles.number}>
            <dt>
              Students
              <Label percent={nums.students.change} />
            </dt>
            <dd>{nums.students.total}</dd>
            <div>{nums.students.matched} Matched</div>
          </div>
          <div className={styles.number}>
            <dt>
              Matches
              <Label percent={nums.matches.change} />
            </dt>
            <dd>{nums.matches.total}</dd>
            <div>{nums.matches.perVolunteer} Per Volunteer</div>
          </div>
          <div className={styles.number}>
            <dt>
              Meetings
              <Label percent={nums.meetings.change} />
            </dt>
            <dd>{nums.meetings.total}</dd>
            <div>{nums.meetings.recurring} Recurring</div>
          </div>
        </dl>
        <Graph timeline={nums.timeline} />
      </div>
    </>
  );
}
