import { ReactNode, useEffect, useState } from 'react';
import cn from 'classnames';

import Checkmark from './checkmark';
import styles from './loader.module.scss';

export interface LoaderProps {
  active: boolean;
  checked?: boolean;
  children?: ReactNode;
}

export default function Loader({
  active,
  checked,
  children,
}: LoaderProps): JSX.Element {
  const [visible, setVisible] = useState<boolean>(active);
  const [closing, setClosing] = useState<boolean>(false);

  useEffect(() => {
    // Workaround to ensure `visibility` stays `visible` while animating the
    // opacity and elevation (during closing).
    if (!active) {
      setClosing(true);
      setTimeout(() => setVisible(false), 280);
    } else {
      setClosing(false);
      setVisible(true);
    }
  }, [active]);

  return (
    <div
      data-cy='loader'
      className={cn(styles.overlay, {
        [styles.visible]: visible,
        [styles.closing]: closing,
      })}
    >
      <div className={styles.overlayContent}>
        <Checkmark
          data-cy='checkmark'
          className={styles.overlayCheckmark}
          checked={checked}
        />
        <article className={cn(styles.message, { [styles.visible]: checked })}>
          {children}
        </article>
      </div>
    </div>
  );
}
