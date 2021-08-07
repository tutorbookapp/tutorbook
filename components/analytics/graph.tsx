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
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { AnalyticsRes } from 'pages/api/orgs/[id]/analytics';

import { caps } from 'lib/utils';
import { sameDate } from 'lib/utils/time';

import styles from './graph.module.scss';

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

export type GraphProps = Pick<AnalyticsRes, 'timeline'>;

export default function Graph({ timeline }: GraphProps): JSX.Element {
  const { lang: locale } = useTranslation();
  const domain = useMemo(() => {
    const x = timeline;
    const start = x[0] ? x[0].date : 0;
    const end = x.length > 0 ? x[x.length - 1].date : 0;
    return [start, end];
  }, [timeline]);

  return (
    <ResponsiveContainer height={450} width='100%' className={styles.chart}>
      <LineChart data={timeline}>
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
                    <tr key={name} className={name ? styles[name] : undefined}>
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
          type='number'
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
          domain={domain}
          type='number'
          scale='time'
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
  );
}
