import { Typography } from '@rmwc/typography';

import AnimatedCheckmark from '@tutorbook/animated-checkmark';

import styles from './animated-checkmark-overlay.module.scss';

interface Props {
  readonly active: boolean;
  readonly checked: boolean;
  readonly label: string;
  readonly showLabel: boolean;
}

export default function AnimatedCheckmarkOverlay(props: Props): JSX.Element {
  return (
    <div
      className={
        styles.overlay + (props.active ? ' ' + styles.overlayActive : '')
      }
    >
      <div className={styles.overlayContent}>
        <AnimatedCheckmark
          className={styles.overlayCheckmark}
          checked={props.checked}
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
