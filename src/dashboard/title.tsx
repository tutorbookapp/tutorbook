import React from 'react';

import styles from './title.module.scss';

interface ActionProps {
  label: string;
  onClick: () => void;
}

function Action({ label, onClick }: ActionProps): JSX.Element {
  return (
    <button onClick={onClick} type='button' className={styles.button}>
      {label}
    </button>
  );
}

interface TitleProps {
  header: string;
  body: string;
  actions?: ActionProps[];
}

export default function Title({
  header,
  body,
  actions,
}: TitleProps): JSX.Element {
  return (
    <header className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.title}>
          <h1 className={styles.header}>{header}</h1>
          <p className={styles.body}>{body}</p>
        </div>
      </div>
      {actions && actions.length && (
        <div className={styles.menu}>
          <div />
          <div className={styles.actions}>
            {actions.map((props: ActionProps) => (
              <Action key={props.label} {...props} />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
