import styles from './group.module.scss';

export interface GroupProps {
  label: string;
  children: JSX.Element[];
}

export default function Group({ label, children }: GroupProps): JSX.Element {
  return (
    <div className={styles.group}>
      <input id={label} type='checkbox' aria-label={label} />
      <label htmlFor={label}>
        <h3>{label}</h3>
      </label>
      <ul>{children}</ul>
    </div>
  );
}
