import React from 'react';
import Checkmark from './checkmark';

import styles from './loader.module.scss';

interface Props {
  readonly active: boolean;
  readonly checked?: boolean;
}

export default function Loader({ active, checked }: Props): JSX.Element {
  const [visible, setVisible] = React.useState<boolean>(active);
  const [closing, setClosing] = React.useState<boolean>(false);

  React.useEffect(() => {
    // We have to wait a tick before changing the class for the animation to
    // work. @see {@link https://stackoverflow.com/a/37643388/10023158}
    if (!active) {
      setClosing(true);
      setTimeout(() => setVisible(false), 500);
    } else {
      setClosing(false);
      setVisible(true);
    }
  }, [active]);

  return (
    <div
      className={
        styles.overlay +
        (visible ? ` ${styles.visible}` : '') +
        (closing ? ` ${styles.closing}` : '')
      }
    >
      <div className={styles.overlayContent}>
        <Checkmark className={styles.overlayCheckmark} checked={!!checked} />
      </div>
    </div>
  );
}
