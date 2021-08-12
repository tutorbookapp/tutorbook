import { TooltipProps } from 'recharts';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

export default function Tooltip({
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
