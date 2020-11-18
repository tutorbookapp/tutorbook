import { nanoid } from 'nanoid';
import { useRef } from 'react';

import styles from './group.module.scss';

export interface GroupProps {
  label: string;
  children: JSX.Element[];
}

export default function Group({ label, children }: GroupProps): JSX.Element {
  const id = useRef<string>(nanoid(5));

  return (
    <div className={styles.group}>
      <input id={id.current} type='checkbox' aria-label={label} />
      <label htmlFor={id.current}>
        <h3>{label}</h3>
      </label>
      <ul>{children}</ul>
    </div>
  );
}
