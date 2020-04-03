import AnimatedCheckmark from '@tutorbook/animated-checkmark'

import styles from './index.module.scss'

interface Props {
  readonly active: boolean;
  readonly checked: boolean;
  readonly label: string;
}

export default function AnimatedCheckmarkOverlay(props: Props): JSX.Element {
  return (
    <div 
      className={styles.overlay + 
        (props.active ? ' ' + styles.overlayActive : '')}
    >
      <div className={styles.overlayContent}>
        <AnimatedCheckmark 
          className={styles.overlayCheckmark} 
          checked={props.checked}
        />
        <p className={styles.overlayLabel}>
          {props.label}
        </p>
      </div>
    </div>
  );
}
