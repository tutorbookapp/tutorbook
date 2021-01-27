import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';

import { Match } from 'lib/model';
import { join } from 'lib/utils';

import styles from './results.module.scss';

export function LoadingResult(): JSX.Element {
  return (
    <Ripple disabled>
      <div className={cn(styles.result, styles.loading)}>
        <div className={styles.subjects} />
        <div className={styles.message} />
      </div>
    </Ripple>
  );
}

export function MatchResult({ match }: { match: Match }): JSX.Element {
  return (
    <Ripple>
      <div className={styles.result}>
        <div className={styles.subjects}>{join(match.subjects)}</div>
        <div className={styles.message}>{match.message}</div>
      </div>
    </Ripple>
  );
}
