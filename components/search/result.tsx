import { SyntheticEvent, useMemo } from 'react';
import Link from 'next/link';
import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';

import Avatar from 'components/avatar';

import { TCallback, User } from 'lib/model';

import styles from './result.module.scss';

interface ResultProps {
  user?: User;
  className?: string;
  loading?: boolean;
  avatar?: boolean;
}

interface ResultButtonProps extends ResultProps {
  onClick?: TCallback<SyntheticEvent<HTMLElement>>;
}

function ResultButton({
  user,
  className,
  loading,
  onClick,
  avatar = true,
}: ResultButtonProps): JSX.Element {
  const disabled = useMemo(() => loading || !onClick, [loading, onClick]);

  return (
    <Ripple disabled={disabled} onClick={onClick}>
      <li
        className={cn(styles.listItem, className, {
          [styles.disabled]: disabled,
          [styles.loading]: loading,
          [styles.avatar]: avatar,
        })}
      >
        {avatar && (
          <div className={styles.img}>
            <Avatar size={85} loading={loading} src={(user || {}).photo} />
          </div>
        )}
        <div className={styles.name}>{user && user.name}</div>
        <div className={styles.bio}>{user && user.bio}</div>
      </li>
    </Ripple>
  );
}

interface ResultLinkProps extends ResultProps {
  href: string;
  newTab?: boolean;
}

// TODO: Refactor this to use the `passHref` prop on `Link` to forward the href
// to the `Ripple` component which will in turn forward it to the `a` tag.
function ResultLink({
  user,
  className,
  loading,
  href,
  newTab,
  avatar = true,
}: ResultLinkProps): JSX.Element {
  const disabled = useMemo(() => loading || !href, [loading, href]);

  return (
    <Ripple disabled={disabled}>
      <li
        className={cn(styles.listItem, className, {
          [styles.disabled]: disabled,
          [styles.loading]: loading,
          [styles.avatar]: avatar,
        })}
      >
        <Link href={href}>
          <a className={styles.link} target={newTab ? '_blank' : undefined}>
            {avatar && (
              <div className={styles.img}>
                <Avatar size={85} loading={loading} src={(user || {}).photo} />
              </div>
            )}
            <div className={styles.name}>{user && user.name}</div>
            <div className={styles.bio}>{user && user.bio}</div>
          </a>
        </Link>
      </li>
    </Ripple>
  );
}

function isResultLinkProps(
  props: ResultLinkProps | ResultButtonProps
): props is ResultLinkProps {
  return !!(props as ResultLinkProps).href;
}

export default function Result(
  props: ResultLinkProps | ResultButtonProps
): JSX.Element {
  if (isResultLinkProps(props)) return <ResultLink {...props} />;
  return <ResultButton {...props} />;
}
