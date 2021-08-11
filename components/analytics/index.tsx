import cn from 'classnames';
import useSWR from 'swr';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { useOrg } from 'lib/context/org';

import styles from './analytics.module.scss';

interface LabelProps {
  percent?: number;
  positive?: boolean;
  negative?: boolean;
}

function Label({ percent }: LabelProps): JSX.Element {
  return (
    <span
      className={cn(styles.label, {
        [styles.positive]: percent && percent > 0,
        [styles.negative]: percent && percent <= 0,
      })}
    >
      {percent ? `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%` : undefined}
    </span>
  );
}

export default function Analytics(): JSX.Element {
  const { org } = useOrg();
  const { data } = useSWR<AnalyticsRes>(
    org?.id ? `/api/orgs/${org.id}/analytics` : null
  );

  // TODO: Ensure that the scale on the chart isn't dependent on the data points
  // being equally spaced out. Instead, it should be relative to the data point
  // `date` value.
  // @see {@link http://recharts.org/en-US/api/XAxis#scale}
  return (
    <div className={styles.wrapper}>
      <dl className={styles.numbers}>
        <div className={styles.number}>
          <dt>
            Users with meetings per week
            <Label
              percent={
                data?.usersWithMeetings[data.usersWithMeetings.length - 1]
                  .growth
              }
            />
          </dt>
          <dd>
            {data?.usersWithMeetings[data.usersWithMeetings.length - 1].users}
          </dd>
        </div>
        <div className={styles.number}>
          <dt>
            Total users
            <Label percent={data?.users[data.users.length - 1].total_growth} />
          </dt>
          <dd>{data?.users[data.users.length - 1].total}</dd>
        </div>
        <div className={styles.number}>
          <dt>
            Meetings per week
            <Label percent={data?.meetings[data.meetings.length - 1].growth} />
          </dt>
          <dd>{data?.meetings[data.meetings.length - 1].meetings}</dd>
        </div>
        <div className={styles.number}>
          <dt>
            Service hours per week
            <Label
              percent={data?.serviceHours[data.meetings.length - 1].growth}
            />
          </dt>
          <dd>{data?.serviceHours[data.meetings.length - 1].hours}</dd>
        </div>
      </dl>
    </div>
  );
}
