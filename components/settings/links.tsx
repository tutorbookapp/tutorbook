import cn from 'classnames';

import Link from 'lib/intl/link';

import styles from './links.module.scss';

export interface LinksProps {
  orgId: string;
  active: 'general' | 'home' | 'signup' | 'zoom';
}

export default function Links({ orgId, active }: LinksProps): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.wrapper}>
      <Link href='/[org]/settings' as={`/${orgId}/settings`}>
        <a className={cn({ [styles.active]: active === 'general' })}>General</a>
      </Link>
      <Link href='/[org]/settings/home' as={`/${orgId}/settings/home`}>
        <a className={cn({ [styles.active]: active === 'home' })}>Home Page</a>
      </Link>
      <Link href='/[org]/settings/signup' as={`/${orgId}/settings/signup`}>
        <a className={cn({ [styles.active]: active === 'signup' })}>
          Signup Page
        </a>
      </Link>
      <Link href='/[org]/settings/zoom' as={`/${orgId}/settings/zoom`}>
        <a className={cn({ [styles.active]: active === 'zoom' })}>
          Zoom Integration
        </a>
      </Link>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}
