import React from 'react';

import styles from './checkmarks.module.scss';

interface CheckmarkItemProps {
  label: string;
  white?: boolean;
}

interface CheckmarksProps {
  labels: string[];
  white?: boolean;
}

function CheckmarkItem(props: CheckmarkItemProps): JSX.Element {
  return (
    <li
      className={
        styles.checkmarkItem +
        (props.white ? ' ' + styles.checkmarkItemWhite : '')
      }
    >
      <span className={styles.checkmarkItemIcon}>
        <svg
          width='12'
          height='12'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M3.719 12c-.302 0-.503-.1-.704-.4L.101 7.191c-.202-.3-.101-.8.301-1.101.302-.2.804-.1 1.005.3L3.72 9.797l.301-.501s0-.1.1-.1l.503-.601 1.91-2.805.503-.6v-.1L8.04 3.886l.904-1.402s0-.1.1-.1l.503-.601.402-.801c.1 0 .1 0 .1-.1l.604-.601c.301-.3.804-.401 1.105-.1.302.3.302.8.1 1.101l-.502.601-.402.701-.1.1-.503.601-.904 1.403s0 .1-.1.1L8.341 6.09l-.402.6-2.01 2.905s0 .1-.1.1l-.503.601-.905 1.402c-.2.2-.402.301-.703.301z'
            fill='#000'
          />
        </svg>
      </span>
      <span className={styles.checkmarkItemText}>{props.label}</span>
    </li>
  );
}

export default function Checkmarks(props: CheckmarksProps): JSX.Element {
  return (
    <ul className={styles.checkmarks}>
      {props.labels.map((label: string, index: number) => (
        <CheckmarkItem key={index} label={label} white={props.white} />
      ))}
    </ul>
  );
}
