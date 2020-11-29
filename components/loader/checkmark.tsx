import cn from 'classnames';

import styles from './checkmark.module.scss';

interface Props {
  className?: string;
  checked?: boolean;
}

export default function Checkmark({ className, checked }: Props): JSX.Element {
  return (
    <svg
      data-cy-checked={!!checked}
      className={cn(styles.checkmark, className, { [styles.checked]: checked })}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 52 52'
    >
      <circle className={styles.circle} cx='26' cy='26' r='25' fill='none' />
      <path
        className={styles.check}
        fill='none'
        d='M14.1 27.2l7.1 7.2 16.7-16.8'
      />
    </svg>
  );
}
