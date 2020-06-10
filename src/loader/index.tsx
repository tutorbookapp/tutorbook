import { Typography } from '@rmwc/typography';

import Checkmark from './checkmark';

import styles from './loader.module.scss';

interface Props {
  readonly active: boolean;
  readonly checked?: boolean;
  readonly label?: string;
  readonly showLabel?: boolean;
}

export default function Loader(props: Props): JSX.Element {
  return (
    <div
      className={
        styles.overlay + (props.active ? ` ${styles.overlayActive}` : '')
      }
    >
      <div className={styles.overlayContent}>
        <Checkmark
          className={styles.overlayCheckmark}
          checked={!!props.checked}
        />
        {props.showLabel ? (
          <div className={styles.overlayLabel}>
            <Typography use='headline6'>{props.label}</Typography>
          </div>
        ) : undefined}
      </div>
    </div>
  );
}
