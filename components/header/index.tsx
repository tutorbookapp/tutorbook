import Link from 'next/link';
import cn from 'classnames';

import styles from './header.module.scss';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
}

function ActionButton({ label, onClick }: ActionButtonProps): JSX.Element {
  return (
    <button onClick={onClick} type='button' className={styles.button}>
      {label}
    </button>
  );
}

interface ActionLinkProps {
  label: string;
  href: string;
  newTab?: boolean;
}

function ActionLink({ label, href, newTab }: ActionLinkProps): JSX.Element {
  return (
    <Link href={href}>
      <a className={styles.button} target={newTab ? '_blank' : undefined}>
        {label}
      </a>
    </Link>
  );
}

interface ActionProps {
  label: string;
  href?: string;
  onClick?: () => void;
  newTab?: boolean;
}

function Action({ label, href, onClick, newTab }: ActionProps): JSX.Element {
  if (href) return <ActionLink label={label} href={href} newTab={newTab} />;
  return <ActionButton label={label} onClick={onClick || (() => {})} />;
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
      <div
        className={cn(styles.content, {
          [styles.withActions]: actions && !!actions.length,
        })}
      >
        <div className={styles.title}>
          <h1 data-cy='title' className={styles.header}>
            {header}
          </h1>
          <p data-cy='subtitle' className={styles.body}>
            {body}
          </p>
        </div>
      </div>
      {actions && !!actions.length && (
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

Title.defaultProps = { actions: [] };
