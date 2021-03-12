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
      </div>
    </>
  );
}
