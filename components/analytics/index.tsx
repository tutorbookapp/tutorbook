import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  YAxis,
  XAxis,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import cn from 'classnames';
import { useMemo } from 'react';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { useOrg } from 'lib/context/org';

import Label from './label';

interface TickProps {
  x: number;
  y: number;
  payload: { value: number };
}

function CustomTooltip({
  label,
  payload,
}: TooltipProps<number, string>): JSX.Element {
  const { lang: locale } = useTranslation();
  if (!payload || !payload[0] || !payload[0].payload) return <></>;
  const data = payload[0].payload;
  return (
    <div className='tooltip'>
      <h4>Users with meetings</h4>
      <h5>
        {new Date(data.week).toLocaleString(locale, {
          month: 'short',
          weekday: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </h5>
      <p>
        <code>{data.users}</code> users with meetings
      </p>
      {data.growth !== null && (
        <p>
          <code className={cn('growth', { positive: data.growth > 0 })}>
            {data.growth > 0
              ? `+${data.growth.toFixed(2)}%`
              : `${data.growth.toFixed(2)}%`}
          </code>{' '}
          from previous week
        </p>
      )}
      <style jsx>{`
        .tooltip {
          border: 1px solid var(--accents-2);
          border-radius: 8px;
          background: var(--background);
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
          padding: 8px;
          padding-left: 18px;
          position: relative;
        }

        .tooltip::before {
          position: absolute;
          top: 8px;
          left: 8px;
          bottom: 8px;
          width: 4px;
          border-radius: 2px;
          background: #82ca9d;
          content: '';
        }

        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }

        h5 {
          margin: 4px 0;
          font-size: 10px;
          font-weight: 400;
          color: var(--accents-6);
        }

        p {
          margin: 6px 0;
          font-size: 12px;
          font-weight: 400;
        }

        p:last-child {
          margin-bottom: 2px;
        }

        code {
          font-family: var(--font-mono);
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          padding: 2px 4px;
        }

        code.growth {
          background: rgba(255, 0, 0, 0.1);
          color: rgb(255, 0, 0);
        }

        code.growth.positive {
          background: rgba(0, 255, 0, 0.1);
          color: rgb(0, 255, 0);
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
  const { lang: locale } = useTranslation();

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
          <AreaChart
            width={500 - 12}
            height={250}
            data={usersWithMeetings}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id='colorUv' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#8884d8' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#8884d8' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='colorPv' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#82ca9d' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#82ca9d' stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine
              x={new Date().valueOf()}
              stroke='#ea4335'
              strokeWidth={2}
              isFront
              label={({ viewBox }) => (
                <circle
                  fill='#ea4335'
                  stroke='none'
                  r='6'
                  cx={viewBox.x}
                  cy={viewBox.height + viewBox.y + 6 + 1}
                  fillOpacity='1'
                />
              )}
            />
            <XAxis
              dataKey='week'
              scale='time'
              type='number'
              domain={['dataMin', 'dataMax']}
              interval={10}
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              tick={({ x, y, payload }: TickProps) => {
                console.log('X:', x);
                return (
                  <text
                    fontSize='12px'
                    height='30'
                    type='text'
                    x={x}
                    y={y}
                    stroke='none'
                    fill='var(--accents-5)'
                    textAnchor='middle'
                  >
                    <tspan x={x} dy='12px'>
                      {new Date(payload.value).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </tspan>
                  </text>
                );
              }}
            />
            <YAxis
              dataKey='users'
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              tick={({ x, y, payload }: TickProps) => {
                console.log('X:', x);
                return (
                  <text
                    fontSize='12px'
                    height='30'
                    type='number'
                    x={x}
                    y={y}
                    stroke='none'
                    fill='var(--accents-5)'
                    orientation='left'
                    textAnchor='end'
                  >
                    <tspan x={x} dy='4px'>
                      {payload.value}
                    </tspan>
                  </text>
                );
              }}
            />
            <CartesianGrid strokeDasharray='3 3' />
            <Tooltip
              cursor={false}
              allowEscapeViewBox={{ x: false, y: true }}
              content={CustomTooltip}
            />
            <Area
              type='monotone'
              dataKey='users'
              stroke='#8884d8'
              fillOpacity={1}
              fill='url(#colorUv)'
            />
          </AreaChart>
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
          <AreaChart
            width={500 - 12}
            height={250}
            data={usersWithMeetings}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id='colorUv' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#8884d8' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#8884d8' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='colorPv' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#82ca9d' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#82ca9d' stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine
              x={new Date().valueOf()}
              stroke='#ea4335'
              strokeWidth={2}
              isFront
              label={({ viewBox }) => (
                <circle
                  fill='#ea4335'
                  stroke='none'
                  r='6'
                  cx={viewBox.x}
                  cy={viewBox.height + viewBox.y + 6 + 1}
                  fillOpacity='1'
                />
              )}
            />
            <XAxis
              dataKey='week'
              scale='time'
              type='number'
              domain={['dataMin', 'dataMax']}
              interval={10}
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              tick={({ x, y, payload }: TickProps) => {
                console.log('X:', x);
                return (
                  <text
                    fontSize='12px'
                    height='30'
                    type='text'
                    x={x}
                    y={y}
                    stroke='none'
                    fill='var(--accents-5)'
                    textAnchor='middle'
                  >
                    <tspan x={x} dy='12px'>
                      {new Date(payload.value).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </tspan>
                  </text>
                );
              }}
            />
            <YAxis
              dataKey='growth'
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              tick={({ x, y, payload }: TickProps) => {
                console.log('X:', x);
                return (
                  <text
                    fontSize='12px'
                    height='30'
                    type='number'
                    x={x}
                    y={y}
                    stroke='none'
                    fill='var(--accents-5)'
                    orientation='left'
                    textAnchor='end'
                  >
                    <tspan x={x} dy='4px'>
                      {payload.value}
                    </tspan>
                  </text>
                );
              }}
            />
            <CartesianGrid strokeDasharray='3 3' />
            <Tooltip
              cursor={false}
              allowEscapeViewBox={{ x: false, y: true }}
              content={CustomTooltip}
            />
            <Area
              type='monotone'
              dataKey='growth'
              stroke='#82ca9d'
              fillOpacity={1}
              fill='url(#colorPv)'
            />
          </AreaChart>
        </div>
      </div>
      <style jsx>{`
        main {
          max-width: var(--page-width-with-margin);
          margin: 48px auto;
          padding: 0 24px;
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
