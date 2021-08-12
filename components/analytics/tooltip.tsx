import { createContext, useContext } from 'react';
import { TooltipProps as RechartsTooltipProps } from 'recharts';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import { formatRate } from './utils';

export interface TooltipProps {
  header: string;
  content: { dataKey: string; dataLabel: string; rate?: boolean }[];
  color: string;
}

export const TooltipContext = createContext<TooltipProps>({
  header: '',
  content: [],
  color: '',
});

export default function Tooltip({
  payload,
}: RechartsTooltipProps<number, string>): JSX.Element {
  const { lang: locale } = useTranslation();
  const { header, content, color } = useContext(TooltipContext);
  if (!payload || !payload[0] || !payload[0].payload) return <></>;
  const data = payload[0].payload as Record<string, number>;
  return (
    <div className='tooltip'>
      <h4>{header}</h4>
      <h5>
        {new Date(data.week).toLocaleString(locale, {
          month: 'short',
          weekday: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </h5>
      {content.map(({ dataKey, dataLabel, rate }) => (
        <p>
          {!rate && <code>{data[dataKey]}</code>}
          {rate && (
            <code className={cn('rate', { positive: data[dataKey] > 0 })}>
              {formatRate(data[dataKey])}
            </code>
          )}
          {` ${dataLabel}`}
        </p>
      ))}
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
          background: ${color};
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

        code.rate {
          background: rgba(255, 0, 0, 0.1);
          color: rgb(255, 0, 0);
        }

        code.rate.positive {
          background: rgba(0, 255, 0, 0.1);
          color: rgb(0, 255, 0);
        }
      `}</style>
    </div>
  );
}
