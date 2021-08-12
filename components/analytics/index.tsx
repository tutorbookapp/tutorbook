import { ReactNode, useMemo } from 'react';
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
  data: T[];
  title: ReactNode;
  children: ReactNode;
  header: string;
  content: { dataKey: keyof T; dataLabel: string; rate?: boolean }[];
  color: string;
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
    const today = data.find((d) => sameWeek(new Date(d.week), new Date()));
    return today ? today[content[0].dataKey] : 0;
  }, [data, content]);

  return (
    <div className='card'>
      <article className='header'>
        <header>
          <h2>{content[0].rate ? formatRate(num) : num}</h2>
          <h3>{title}</h3>
        </header>
        <p>{children}</p>
      </article>
      <Graph data={data} header={header} content={content} color={color} />
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
        }

        .header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 400;
          margin-left: 12px;
        }

        .header p {
          margin: 0;
          font-size: 14px;
          font-weight: 400;
          color: var(--accents-5);
        }

        :global(.recharts-cartesian-grid line) {
          // Ensure that our 1px lines actually stay 1px (to match other borders).
          // @see {@link https://stackoverflow.com/a/34229584/10023158}
          shape-rendering: crispedges;
          stroke: var(--accents-2);
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
      {usersWithMeetings && meetings && serviceHours && users && (
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
            users.
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
            last week. You should focus on growth rates to succeed; a growth
            rate of{' '}
            <Link href='http://www.paulgraham.com/growth.html'>
              5-7% per week
            </Link>{' '}
            is good.
          </Card>
          <Card
            title='Meetings this week'
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
            The number of meetings per week.
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
            The growth rate of the number of meetings per week.
          </Card>
          <Card
            title='Service hours this week'
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
            title='New users this week'
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
            The number of users created per week.
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
            The growth rate of the number of new users per week.
          </Card>
          <Card
            title='Total users'
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
            The total number of users. Ever.
          </Card>
          <Card
            title={
              <>
                Weekly growth rate of
                <br />
                total users
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
            The weekly growth rate of the total number of users. Ever.
          </Card>
        </div>
      )}
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
