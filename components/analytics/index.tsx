import { ReactNode, useMemo } from 'react';
import useSWR from 'swr';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { useOrg } from 'lib/context/org';

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

  // TODO: Ensure that the scale on the chart isn't dependent on the data points
  // being equally spaced out. Instead, it should be relative to the data point
  // `date` value.
  // @see {@link http://recharts.org/en-US/api/XAxis#scale}
  return (
    <main>
      <div className='graphs'>
        <div className='graph'>
          <article className='header'>
            <header>
              <h2>
                {
                  data?.usersWithMeetings[data.usersWithMeetings.length - 1]
                    .users
                }
              </h2>
              <h3>
                Users with meetings
                <br />
                per week
              </h3>
            </header>
            <p>
              The number of users who have had a meeting in the last week. This
              is your{' '}
              <Link href='https://thoughtbot.com/blog/north-star-metric'>
                north star metric
              </Link>
              ; it measures how much authentic value you are providing to your
              users.
            </p>
          </article>
          <Graph
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
            color='#8884d8'
          />
        </div>
        <div className='graph'>
          <article className='header'>
            <header>
              <h2>
                {data?.usersWithMeetings[
                  data.usersWithMeetings.length - 1
                ].growth.toFixed(2)}
              </h2>
              <h3>
                Growth rate of users
                <br />
                with meetings per week
              </h3>
            </header>
            <p>
              The growth rate of the number of users who have had a meeting in
              the last week. You should focus on growth rates to succeed; a
              growth rate of{' '}
              <Link href='http://www.paulgraham.com/growth.html'>
                5-7% per week
              </Link>{' '}
              is good.
            </p>
          </article>
          <Graph
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
            color='#82ca9d'
          />
        </div>
      </div>
      <style jsx>{`
        main {
          max-width: var(--page-width-with-margin);
          padding: 48px 24px;
          margin: 0 auto;
        }

        .graphs {
          display: flex;
        }

        .graph {
          border: 1px solid var(--accents-2);
          border-radius: 8px;
          padding-bottom: 24px;
          margin: 0 12px;
        }

        .graph:first-child {
          margin-left: 0;
        }

        .graph:last-child {
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
    </main>
  );
}
