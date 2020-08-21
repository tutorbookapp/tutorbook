import Link from 'lib/intl/link';

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
  as: string;
}

function ActionLink({ label, href, as }: ActionLinkProps): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <Link href={href} as={as}>
      <a className={styles.button}>{label}</a>
    </Link>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

interface ActionProps {
  label: string;
  href?: string;
  as?: string;
  onClick?: () => void;
}

function Action({ label, href, as, onClick }: ActionProps): JSX.Element {
  if (href && as) return <ActionLink label={label} href={href} as={as} />;
  return <ActionButton label={label} onClick={onClick || (() => {})} />;
}

Action.defaultProps = { href: '', as: undefined, onClick: () => {} };

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

Title.defaultProps = { actions: [] };
