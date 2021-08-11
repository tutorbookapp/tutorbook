import cn from 'classnames';
import useSWR from 'swr';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { useOrg } from 'lib/context/org';

interface LabelProps {
  percent?: number;
  positive?: boolean;
  negative?: boolean;
}

function Label({ percent }: LabelProps): JSX.Element {
  return (
    <span
      className={cn('label', {
        positive: percent && percent > 0,
        negative: percent && percent <= 0,
      })}
    >
      {percent ? `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%` : undefined}
      <style jsx>{`
        .label {
          font-size: 14px;
          line-height: 14px;
          margin-left: 8px;
          border-radius: 12px;
          padding: 2px 8px;
          border: 1px solid;
        }

        .positive {
          border-color: var(--analytics-green-bd);
          background: var(--analytics-green-bg);
          color: var(--analytics-green-fg);
        }

        .negative {
          border-color: var(--analytics-red-bd);
          background: var(--analytics-red-bg);
          color: var(--analytics-red-fg);
        }
      `}</style>
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
    <div className='wrapper'>
      <dl className='numbers'>
        <div className='number'>
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
        <div className='number'>
          <dt>
            Total users
            <Label percent={data?.users[data.users.length - 1].total_growth} />
          </dt>
          <dd>{data?.users[data.users.length - 1].total}</dd>
        </div>
        <div className='number'>
          <dt>
            Meetings per week
            <Label percent={data?.meetings[data.meetings.length - 1].growth} />
          </dt>
          <dd>{data?.meetings[data.meetings.length - 1].meetings}</dd>
        </div>
        <div className='number'>
          <dt>
            Service hours per week
            <Label
              percent={data?.serviceHours[data.meetings.length - 1].growth}
            />
          </dt>
          <dd>{data?.serviceHours[data.meetings.length - 1].hours}</dd>
        </div>
      </dl>
      <style jsx>{`
        .wrapper {
          max-width: var(--page-width-with-margin);
          padding: 0 24px;
          margin: 0 auto;
        }

        .numbers {
          display: flex;
          margin: 56px 0;
        }

        .number {
          flex-grow: 1;
          flex-basis: 0;
          padding: 0 36px;
          border-right: 1px solid var(--accents-2);
        }

        .number:first-child {
          padding-left: 0;
        }

        .number:last-child {
          border-right: none;
          padding-right: 0;
        }

        .number dt {
          margin: 0;
          font-size: 14px;
          line-height: 14px;
          color: var(--accents-6);
        }

        .number dd {
          margin: 12px 0;
          font-size: 56px;
          line-height: 56px;
          letter-spacing: -4px;
          text-indent: -4px;
          font-weight: 500;
        }

        .number div {
          margin: 0;
          font-size: 14px;
          line-height: 14px;
          color: var(--accents-6);
        }
      `}</style>
    </div>
  );
}
