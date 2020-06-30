import React from 'react';

import styles from './checkmark.module.scss';

interface Props {
  className?: string;
  black?: boolean;
  checked?: boolean;
}

export default function Checkmark({
  className,
  black,
  checked,
}: Props): JSX.Element {
  const checkedClassName = black
    ? styles.checkmarkCheckedBlack
    : styles.checkmarkChecked;
  return (
    <svg
      className={
        styles.checkmark +
        (className ? ` ${className}` : '') +
        (checked ? ` ${checkedClassName}` : '') +
        (black ? ` ${styles.checkmarkBlack}` : '')
      }
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 52 52'
    >
      <circle
        className={
          styles.checkmarkCircle +
          (black ? ` ${styles.checkmarkCircleBlack}` : '')
        }
        cx='26'
        cy='26'
        r='25'
        fill='none'
      />
      <path
        className={styles.checkmarkCheck}
        fill='none'
        d='M14.1 27.2l7.1 7.2 16.7-16.8'
      />
    </svg>
  );
}
