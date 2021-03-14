import {
  CartesianGrid,
  DotProps,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import cn from 'classnames';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import Header from 'components/header';

import { caps } from 'lib/utils';
import { sameDate } from 'lib/utils/time';
import { useOrg } from 'lib/context/org';

import styles from './overview.module.scss';

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
      {`${percent}%`}
    </span>
  );
}

interface CustomDotProps extends DotProps {
  value: number;
}

function CustomDot({ cx, cy, fill, value }: CustomDotProps): JSX.Element {
  return (
    <g className={styles.dot}>
      <circle
        fill={fill}
        strokeOpacity={0.1}
        strokeWidth={12}
        stroke={fill}
        cx={cx}
        cy={cy}
        r={Math.max(4, Math.min(8 * (value / 250), 8))}
      />
    </g>
  );
}

interface TickProps {
  x: number;
  y: number;
  payload: { value: number };
}

export default function Overview(): JSX.Element {
  const { org } = useOrg();
  const { t, lang: locale } = useTranslation();
  const { data } = useSWR<AnalyticsRes>(`/api/orgs/${org?.id || ''}/analytics`);

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
              <Label percent={data?.volunteers.change || 12.5} />
            </dt>
            <dd>{data?.volunteers.total || 258}</dd>
            <div>{data?.volunteers.matched || 189} Matched</div>
          </div>
          <div className={styles.number}>
            <dt>
              Students
              <Label percent={data?.students.change || 12.5} />
            </dt>
            <dd>{data?.students.total || 218}</dd>
            <div>{data?.students.matched || 218} Matched</div>
          </div>
          <div className={styles.number}>
            <dt>
              Matches
              <Label percent={data?.matches.change || -2.3} />
            </dt>
            <dd>{data?.matches.total || 443}</dd>
            <div>{data?.matches.meeting || 413} Meeting</div>
          </div>
          <div className={styles.number}>
            <dt>
              Meetings
              <Label percent={data?.meetings.change || 32.5} />
            </dt>
            <dd>{data?.meetings.total || 5425}</dd>
            <div>{data?.meetings.recurring || 546} Recurring</div>
          </div>
        </dl>
        <ResponsiveContainer height={450} width='100%' className={styles.chart}>
          <LineChart data={data?.timeline}>
            <Tooltip
              cursor={false}
              allowEscapeViewBox={{ x: false, y: true }}
              content={({ label, payload }: TooltipProps<number, string>) => (
                <div className={styles.tooltip}>
                  <div className={styles.header}>
                    {new Date(label).toLocaleString(locale, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <table>
                    <tbody>
                      {payload?.map(({ name, value }) => (
                        <tr className={name ? styles[name] : undefined}>
                          <td>{value}</td>
                          <td>{caps(name || '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            />
            <CartesianGrid
              vertical={false}
              strokeDasharray='8'
              stroke='var(--accents-2)'
            />
            <YAxis
              width={38}
              tickMargin={8}
              tickLine={false}
              axisLine={false}
              tick={({ x, y, payload }: TickProps) => (
                <text
                  fontSize='14px'
                  type='number'
                  width='30'
                  x={x - 30}
                  y={y}
                  stroke='none'
                  fill='var(--accents-5)'
                  textAnchor='start'
                >
                  <tspan x={x - 30} dy='0.355em'>
                    {payload.value}
                  </tspan>
                </text>
              )}
            />
            <XAxis
              height={28}
              dataKey='date'
              tickMargin={12}
              tickLine={false}
              axisLine={false}
              tick={({ x, y, payload }: TickProps) => (
                <text
                  fontSize='14px'
                  height='30'
                  type='text'
                  x={x}
                  y={y}
                  stroke='none'
                  fill='var(--accents-5)'
                  textAnchor='middle'
                >
                  <tspan x={x} dy='0.71em'>
                    {sameDate(new Date(payload.value), new Date())
                      ? 'Today'
                      : new Date(payload.value).toLocaleString(locale, {
                          month: 'long',
                          day: 'numeric',
                        })}
                  </tspan>
                </text>
              )}
            />
            <Line
              type='monotone'
              dataKey='matches'
              stroke='var(--analytics-matches)'
              activeDot={CustomDot}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='volunteers'
              stroke='var(--analytics-volunteers)'
              activeDot={CustomDot}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='students'
              stroke='var(--analytics-students)'
              activeDot={CustomDot}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
