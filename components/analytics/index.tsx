import { useMemo } from 'react';
import useSWR from 'swr';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { useOrg } from 'lib/context/org';

import Graph from './graph';

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
              <a
                href='https://thoughtbot.com/blog/north-star-metric'
                target='_blank'
                rel='noopener noreferrer'
              >
                north star metric
              </a>
              ; it measures how much authentic value you are providing to your
              users.
            </p>
          </article>
          <Graph data={usersWithMeetings} dataKey='users' color='#8884d8' />
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
              <a
                href='http://www.paulgraham.com/growth.html'
                target='_blank'
                rel='noopener noreferrer'
              >
                5-7% per week
              </a>{' '}
              is good.
            </p>
          </article>
          <Graph data={usersWithMeetings} dataKey='growth' color='#82ca9d' />
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

        .header a {
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
