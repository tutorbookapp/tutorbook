import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import useTranslation from 'next-translate/useTranslation';

import Tooltip, { TooltipContext } from './tooltip';
import { formatRate } from './utils';

interface LabelProps {
  viewBox: { height: number; width: number; x: number; y: number };
}

interface TickProps {
  x: number;
  y: number;
  payload: { value: number };
}

export interface GraphProps<T> {
  data: T[];
  header: string;
  content: { dataKey: string; dataLabel: string; rate?: boolean }[];
  color: string;
}

export default function Graph<T>({
  data,
  header,
  content,
  color,
}: GraphProps<T>): JSX.Element {
  const { lang: locale } = useTranslation();
  return (
    <TooltipContext.Provider value={{ header, content, color }}>
      <AreaChart
        width={500 - 12}
        height={250}
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id={`${content.map((c) => c.dataKey).join('-')}-color`}
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop offset='5%' stopColor={color} stopOpacity={0.5} />
            <stop offset='95%' stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <ReferenceLine
          x={new Date().valueOf()}
          stroke='#ea4335'
          strokeWidth={2}
          isFront
          label={({ viewBox }: LabelProps) => (
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
          tick={({ x, y, payload }: TickProps) => (
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
          )}
        />
        <YAxis
          dataKey={content[0].dataKey}
          axisLine={false}
          tickLine={false}
          tickMargin={4}
          tick={({ x, y, payload }: TickProps) => (
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
                {content[0].rate ? formatRate(payload.value, 0) : payload.value}
              </tspan>
            </text>
          )}
        />
        <CartesianGrid strokeDasharray='3 3' />
        <RechartsTooltip
          cursor={false}
          allowEscapeViewBox={{ x: false, y: true }}
          content={Tooltip}
        />
        <Area
          type='monotone'
          dataKey={content[0].dataKey}
          stroke={color}
          fillOpacity={1}
          fill={`url(#${content.map((c) => c.dataKey).join('-')}-color)`}
        />
      </AreaChart>
    </TooltipContext.Provider>
  );
}
