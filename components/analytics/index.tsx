import { ReactNode, useMemo } from 'react';
import cn from 'classnames';
import useSWR from 'swr';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { useOrg } from 'lib/context/org';

import { formatRate, sameWeek } from './utils';
import Graph from './graph';

interface LinkProps {
  href: string;
  children: ReactNode;
}

function Link({ href, children }: LinkProps): JSX.Element {
  return (
    <a href={href} target='_blank' rel='noopener noreferrer'>
      {children}
      <style jsx>{`
        a {
          color: var(--accents-5);
          text-decoration: underline;
        }
      `}</style>
    </a>
  );
}

interface CardProps<T> {
  data?: T[];
  title?: ReactNode;
  children?: ReactNode;
  header?: string;
  content?: { dataKey: string; dataLabel: string; rate?: boolean }[];
  color?: string;
}

function Card<T extends Record<string, number> & { week: number }>({
  data,
  title,
  children,
  header,
  content,
  color,
}: CardProps<T>): JSX.Element {
  const num = useMemo(() => {
    if (!data || !content) return undefined;
    const today = data.find((d) => sameWeek(new Date(d.week), new Date()));
    return today ? today[content[0].dataKey] : 0;
  }, [data, content]);

  return (
    <div className='card'>
      <article className='header'>
        <header>
          <h2 className={cn({ loading: num === undefined })}>
            {content && content[0].rate && num !== undefined ? formatRate(num) : num}
          </h2>
          <h3>{title}</h3>
        </header>
        <p>{children}</p>
      </article>
      {!(data && header && content && color) && (
        <div className='graph loading' />
      )}
      {data && header && content && color && (
        <Graph data={data} header={header} content={content} color={color} />
      )}
      <style jsx>{`
        .card {
          border: 1px solid var(--accents-2);
          border-radius: 8px;
          padding-bottom: 24px;
          max-width: calc(var(--page-width) / 2 - 12px);
          margin: 12px;
        }

        .card:nth-child(odd) {
          margin-left: 0;
        }

        .card:nth-child(even) {
          margin-right: 0;
        }

        .header {
          margin: 24px;
        }

        .header header {
          display: flex;
          align-items: center;
        }

        .header h2 {
          margin: 0;
          font-size: 48px;
          font-weight: 500;
          letter-spacing: -4px;
          line-height: 1;
          height: 48px;
        }

        h2.loading {
          width: 100px;
        }

        .header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 400;
          margin-left: 12px;
          height: 40px;
        }

        .header p {
          margin: 8px 0;
          font-size: 14px;
          font-weight: 400;
          color: var(--accents-5);
        }

        .loading {
          border-radius: 6px;
        }

        .graph.loading {
          width: calc(488px - 48px);
          height: 250px;
          margin: 0 24px;
        }

        :global(.recharts-cartesian-grid line) {
          shape-rendering: crispedges;
          stroke: var(--accents-2);
        }

        :global(.recharts-active-dot circle) {
          stroke-width: 0;
        }

        :global(.recharts-reference-line-line) {
          shape-rendering: crispedges;
        }

        :global(.recharts-cartesian-grid-horizontal line:first-child) {
          stroke-dasharray: none;
        }

        :global(.xAxis .recharts-cartesian-axis-tick:first-child) {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default function Analytics(): JSX.Element {
  const { org } = useOrg();
  const { data } = useSWR<AnalyticsRes>(
    org?.id ? `/api/orgs/${org.id}/analytics` : null
  );
  const usersWithMeetings = useMemo(
    () =>
      data?.usersWithMeetings.map((d) => ({
        ...d,
        week: new Date(d.week).valueOf(),
      })),
    [data]
  );
  const meetings = useMemo(
    () =>
      data?.meetings.map((d) => ({
        ...d,
        week: new Date(d.week).valueOf(),
      })),
    [data]
  );
  const serviceHours = useMemo(
    () =>
      data?.serviceHours.map((d) => ({
        ...d,
        week: new Date(d.week).valueOf(),
      })),
    [data]
  );
  const users = useMemo(
    () =>
      data?.users.map((d) => ({
        ...d,
        week: new Date(d.week).valueOf(),
      })),
    [data]
  );

  // TODO: Ensure that the scale on the chart isn't dependent on the data points
  // being equally spaced out. Instead, it should be relative to the data point
  // `date` value.
  // @see {@link http://recharts.org/en-US/api/XAxis#scale}
  return (
    <main>
      <div className='graphs'>
        <Card
          title={
            <>
              Users with meetings
              <br />
              this week
            </>
          }
          data={usersWithMeetings}
          header='Users with meetings'
          content={[
            { dataKey: 'users', dataLabel: 'users with meetings' },
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
          ]}
          color='#64B5F6'
        >
          The number of users who have had a meeting in the last week. This is
          your{' '}
          <Link href='https://thoughtbot.com/blog/north-star-metric'>
            north star metric
          </Link>
          ; it measures how much authentic value you are providing to your
          community.
        </Card>
        <Card
          title={
            <>
              Weekly growth rate of
              <br />
              users with meetings
            </>
          }
          data={usersWithMeetings}
          header='Users with meetings'
          content={[
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
            { dataKey: 'users', dataLabel: 'users with meetings' },
          ]}
          color='#64B5F6'
        >
          The growth rate of the number of users who have had a meeting in the
          last week. You should always focus on growth rates instead of totals
          to succeed; a growth rate of{' '}
          <Link href='http://www.paulgraham.com/growth.html'>
            5-7% per week
          </Link>{' '}
          is good.
        </Card>
        <Card
          title={
            <>
              Meetings
              <br />
              this week
            </>
          }
          data={meetings}
          header='Meetings'
          content={[
            { dataKey: 'meetings', dataLabel: 'meetings per week' },
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
          ]}
          color='#81C784'
        >
          The number of meetings per week. This is another{' '}
          <Link href='https://kpi.org/KPI-Basics'>
            key performance indicator
          </Link>{' '}
          that is directly correlated with your{' '}
          <Link href='https://thoughtbot.com/blog/north-star-metric'>
            north star metric
          </Link>
          : the number of users with meetings per week.
        </Card>
        <Card
          title={
            <>
              Weekly growth rate of
              <br />
              meetings per week
            </>
          }
          data={meetings}
          header='Meetings'
          content={[
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
            { dataKey: 'meetings', dataLabel: 'meetings per week' },
          ]}
          color='#81C784'
        >
          The growth rate of the number of meetings per week. This graph
          should look very similar to the growth rate of users with meetings
          per week; both metrics are directly correlated.
        </Card>
        <Card
          title={
            <>
              Service hours
              <br />
              this week
            </>
          }
          data={serviceHours}
          header='Service hours'
          content={[
            { dataKey: 'hours', dataLabel: 'service hours per week' },
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
          ]}
          color='#FF8A65'
        >
          The number of service hours tracked per week.
        </Card>
        <Card
          title={
            <>
              Weekly growth rate of
              <br />
              service hours per week
            </>
          }
          data={serviceHours}
          header='Service hours'
          content={[
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
            { dataKey: 'hours', dataLabel: 'service hours per week' },
          ]}
          color='#FF8A65'
        >
          The growth rate of the number of service hours tracked per week.
        </Card>
        <Card
          title={
            <>
              New users
              <br />
              this week
            </>
          }
          data={users}
          header='New users'
          content={[
            { dataKey: 'users', dataLabel: 'new users' },
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
          ]}
          color='#F06292'
        >
          The number of users created per week. You’ll notice this graph
          correlates well with the <strong>Total users</strong> graph below
          it; as the number of new users spikes, the total number of users
          will spike too.
        </Card>
        <Card
          title={
            <>
              Weekly growth rate of
              <br />
              new users per week
            </>
          }
          data={users}
          header='New users'
          content={[
            {
              dataKey: 'growth',
              dataLabel: 'from previous week',
              rate: true,
            },
            { dataKey: 'users', dataLabel: 'new users' },
          ]}
          color='#F06292'
        >
          The growth rate of the number of users created per week. Note that
          all of these growth rate graphs depict the derivatives of their
          corresponding weekly metrics; they are graphs of the slopes.
        </Card>
        <Card
          title={
            <>
              Users
              <br />
              in all time
            </>
          }
          data={users}
          header='Total users'
          content={[
            { dataKey: 'total', dataLabel: 'total users' },
            {
              dataKey: 'total_growth',
              dataLabel: 'from previous week',
              rate: true,
            },
          ]}
          color='#9575CD'
        >
          The total number of users. This is a{' '}
          <Link href='https://hbr.org/2010/02/entrepreneurs-beware-of-vanity-metrics'>
            vanity metric
          </Link>
          ; a number that looks good on paper but isn’t action oriented. Use
          it for press releases or marketing, but not to measure actual
          growth.
        </Card>
        <Card
          title={
            <>
              Weekly growth rate of
              <br />
              the total number of users
            </>
          }
          data={users}
          header='Total users'
          content={[
            {
              dataKey: 'total_growth',
              dataLabel: 'from previous week',
              rate: true,
            },
            { dataKey: 'total', dataLabel: 'total users' },
          ]}
          color='#9575CD'
        >
          The weekly growth rate of the total number of users. Again, this is
          a{' '}
          <Link href='https://hbr.org/2010/02/entrepreneurs-beware-of-vanity-metrics'>
            vanity metric
          </Link>
          ; this growth rate will <i>always</i> be positive and thus will{' '}
          <i>never</i> provide meaningful feedback on how growth is doing.
        </Card>
      </div>
      <style jsx>{`
        main {
          max-width: var(--page-width-with-margin);
          padding: 48px 24px;
          margin: 0 auto;
        }

        .graphs {
          display: flex;
          flex-wrap: wrap;
        }
      `}</style>
    </main>
  );
}
