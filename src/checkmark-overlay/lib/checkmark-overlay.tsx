import { Typography } from '@rmwc/typography';

import Checkmark from '@tutorbook/checkmark';

import styles from './checkmark-overlay.module.scss';

interface Props {
  readonly active: boolean;
  readonly checked?: boolean;
  readonly label?: string;
  readonly showLabel?: boolean;
}

export default function CheckmarkOverlay(props: Props): JSX.Element {
  return (
    <div
      className={
        styles.overlay + (props.active ? ' ' + styles.overlayActive : '')
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
