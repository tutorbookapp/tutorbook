import { useCallback, useRef } from 'react';
import cn from 'classnames';

import Browser from './browser';
import styles from './window.module.scss';

export interface WindowProps {
  url: string;
  title: string;
}

export default function Window({ url, title }: WindowProps): JSX.Element {
  const ref = useRef<HTMLIFrameElement>(null);
  const refresh = useCallback(() => {
    if (ref.current) ref.current.src = url;
  }, [url]);

  return (
    <div className={styles.container}>
      <div className={styles.window}>
        <div className={styles.header}>
          <div className={cn(styles.traffic, styles.show)}>
            <span className={cn(styles.icon, styles.close)} />
            <span className={cn(styles.icon, styles.minimize)} />
            <span className={cn(styles.icon, styles.fullscreen)} />
          </div>
          <div className={styles.title}>
            <Browser url={url} refresh={refresh} />
          </div>
        </div>
        <div className={styles.body}>
          <iframe title={title} src={url} ref={ref} />
        </div>
      </div>
    </div>
  );
}
