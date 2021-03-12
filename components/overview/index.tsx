import { CartesianGrid, Line, LineChart, ResponsiveContainer } from 'recharts';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import Header from 'components/header';

import { useOrg } from 'lib/context/org';

import styles from './overview.module.scss';

interface LabelProps {
  percent: number;
  positive?: boolean;
  negative?: boolean;
}

function Label({ percent, positive, negative }: LabelProps): JSX.Element {
  return (
    <span
      className={cn(styles.label, {
        [styles.positive]: positive,
        [styles.negative]: negative,
      })}
    >
      {positive && '+'}
      {negative && '-'}
      {`${percent}%`}
    </span>
  );
}

const data = [
  { name: 'Page A', uv: 1000, pv: 2400, amt: 2400, uvError: [75, 20] },
  { name: 'Page B', uv: 300, pv: 4567, amt: 2400, uvError: [90, 40] },
  { name: 'Page C', uv: 280, pv: 1398, amt: 2400, uvError: 40 },
  { name: 'Page D', uv: 200, pv: 9800, amt: 2400, uvError: 20 },
  { name: 'Page E', uv: 278, pv: null, amt: 2400, uvError: 28 },
  { name: 'Page F', uv: 189, pv: 4800, amt: 2400, uvError: [90, 20] },
  { name: 'Page G', uv: 189, pv: 4800, amt: 2400, uvError: [28, 40] },
  { name: 'Page H', uv: 189, pv: 4800, amt: 2400, uvError: 28 },
  { name: 'Page I', uv: 189, pv: 4800, amt: 2400, uvError: 28 },
  { name: 'Page J', uv: 189, pv: 4800, amt: 2400, uvError: [15, 60] },
];

export default function Overview(): JSX.Element {
  const { t } = useTranslation();
  const { org } = useOrg();

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
              <Label percent={12.5} positive />
            </dt>
            <dd>258</dd>
            <div>189 Matched</div>
          </div>
          <div className={styles.number}>
            <dt>
              Students
              <Label percent={12.5} positive />
            </dt>
            <dd>218</dd>
            <div>218 Matched</div>
          </div>
          <div className={styles.number}>
            <dt>
              Matches
              <Label percent={2.3} negative />
            </dt>
            <dd>443</dd>
            <div>85% Meeting</div>
          </div>
          <div className={styles.number}>
            <dt>
              Meetings
              <Label percent={32.5} positive />
            </dt>
            <dd>5,425</dd>
            <div>546 Recurring</div>
          </div>
        </dl>
        <ResponsiveContainer height={450} width='100%' className={styles.chart}>
          <LineChart data={data}>
            <CartesianGrid />
            <Line type='monotone' dataKey='uv' stroke='var(--primary)' />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
