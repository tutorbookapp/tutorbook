import cn from 'classnames';

import LockIcon from 'components/icons/lock';
import RefreshIcon from 'components/icons/refresh';

import styles from './browser.module.scss';

export interface BrowserProps {
  url: string;
  refresh: () => void;
}

export default function Browser({ url, refresh }: BrowserProps): JSX.Element {
  return (
    <div className={styles.bar}>
      <div className={styles.spacer} />
      <div className={styles.input}>
        <div className={styles.url}>
          <i className={styles.lock}>
            <LockIcon />
          </i>
          <a href={url}>{`tutorbook.app${url}`}</a>
          <button className={styles.refresh} type='button' onClick={refresh}>
            <RefreshIcon />
          </button>
        </div>
      </div>
      <div className={cn(styles.spacer, styles.end)} />
    </div>
  );
}
