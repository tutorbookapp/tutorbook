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
  {
    date: new Date(2020, 1, 25),
    volunteers: 154,
    students: 138,
    matches: 321,
    meetings: 1432,
  },
  {
    date: new Date(2020, 1, 26),
    volunteers: 159,
    students: 138,
    matches: 335,
    meetings: 1362,
  },
  {
    date: new Date(2020, 1, 27),
    volunteers: 162,
    students: 140,
    matches: 346,
    meetings: 1532,
  },
  {
    date: new Date(2020, 1, 28),
    volunteers: 180,
    students: 141,
    matches: 456,
    meetings: 1689,
  },
  {
    date: new Date(2020, 1, 29),
    volunteers: 180,
    students: 141,
    matches: 567,
    meetings: 1745,
  },
  {
    date: new Date(2020, 1, 30),
    volunteers: 159,
    students: 138,
    matches: 335,
    meetings: 1362,
  },
  {
    date: new Date(2020, 2, 1),
    volunteers: 162,
    students: 140,
    matches: 346,
    meetings: 1532,
  },
  {
    date: new Date(2020, 2, 2),
    volunteers: 180,
    students: 141,
    matches: 456,
    meetings: 1689,
  },
  {
    date: new Date(2020, 2, 3),
    volunteers: 180,
    students: 141,
    matches: 567,
    meetings: 1745,
  },
  {
    date: new Date(2020, 2, 4),
    volunteers: 182,
    students: 148,
    matches: 534,
    meetings: 2340,
  },
  {
    date: new Date(2020, 2, 5),
    volunteers: 183,
    students: 162,
    matches: 528,
    meetings: 4356,
  },
  {
    date: new Date(2020, 2, 6),
    volunteers: 190,
    students: 184,
    matches: 517,
    meetings: 3478,
  },
  {
    date: new Date(2020, 2, 7),
    volunteers: 203,
    students: 203,
    matches: 449,
    meetings: 4570,
  },
  {
    date: new Date(2020, 2, 8),
    volunteers: 234,
    students: 214,
    matches: 348,
    meetings: 4967,
  },
  {
    date: new Date(2020, 2, 9),
    volunteers: 190,
    students: 184,
    matches: 517,
    meetings: 3478,
  },
  {
    date: new Date(2020, 2, 10),
    volunteers: 203,
    students: 203,
    matches: 449,
    meetings: 4570,
  },
  {
    date: new Date(2020, 2, 11),
    volunteers: 234,
    students: 214,
    matches: 348,
    meetings: 4967,
  },
  {
    date: new Date(2020, 2, 12),
    volunteers: 258,
    students: 218,
    matches: 443,
    meetings: 5425,
  },
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
            <CartesianGrid stroke='var(--accents-2)' />
            <Line
              type='monotone'
              dataKey='volunteers'
              stroke='var(--primary)'
              strokeWidth={2}
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='students'
              stroke='#f38200'
              strokeWidth={2}
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='matches'
              stroke='#f30071'
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
