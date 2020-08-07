import Link from 'lib/intl/link';
import Avatar from 'components/avatar';

import React, { useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { mutate } from 'swr';
import { useUser } from 'lib/account';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { OrgJSON, User, AccountInterface } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';
import { Ripple } from '@rmwc/ripple';
import { Icon } from '@rmwc/icon';

import styles from './pop-over.module.scss';

interface PopOverLinkProps {
  href: string;
  as?: string;
  children: string;
  icon?: string;
}

export function PopOverLink({
  href,
  as,
  children,
  icon,
}: PopOverLinkProps): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <Ripple>
      <div className={styles.item}>
        {icon && (
          <div className={styles.icon}>
            <Icon icon={icon} />
          </div>
        )}
        <Link href={href} as={as}>
          <a className={styles.itemLink}>{children}</a>
        </Link>
      </div>
    </Ripple>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

interface PopOverButtonProps {
  onClick: () => void;
  children: string;
  icon?: string;
}

export function PopOverButton({
  onClick,
  children,
  icon,
}: PopOverButtonProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.item}>
        {icon && (
          <div className={styles.icon}>
            <Icon icon={icon} />
          </div>
        )}
        <span className={styles.label}>{children}</span>
      </button>
    </Ripple>
  );
}

interface PopOverAccountProps {
  account: AccountInterface;
}

export function PopOverAccountButton({
  account,
  onClick,
}: { onClick: () => void } & PopOverAccountProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.item}>
        <div className={styles.avatar}>
          <Avatar src={account.photo} />
        </div>
        <span className={styles.label}>{account.name}</span>
      </button>
    </Ripple>
  );
}

export function PopOverAccountHeader({
  account,
}: PopOverAccountProps): JSX.Element {
  return (
    <div className={`${styles.item} ${styles.header}`}>
      <div className={styles.avatar}>
        <Avatar src={account.photo} />
      </div>
      <span className={styles.label}>{account.name}</span>
    </div>
  );
}

export function PopOverAccountLink({
  account,
  href,
  as,
}: { href: string; as?: string } & PopOverAccountProps): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <Ripple>
      <div className={styles.item}>
        <Link href={href} as={as}>
          <a className={styles.itemLink}>
            <div className={styles.avatar}>
              <Avatar src={account.photo} />
            </div>
            <span className={styles.label}>{account.name}</span>
          </a>
        </Link>
      </div>
    </Ripple>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

interface PopOverMenuProps {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
}

export default function PopOverMenu({
  open,
  onClose,
  children,
}: PopOverMenuProps): JSX.Element {
  const { t } = useTranslation();
  const { user, orgs } = useUser();

  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  return (
    <MenuSurfaceAnchor>
      {children}
      <MenuSurface open={open} onClose={onClose}>
        <div className={styles.picker}>
          <PopOverAccountHeader account={user} />
          <PopOverLink href='/'>{t('common:home')}</PopOverLink>
          <PopOverLink href='/search/[[...slug]]' as='/search'>
            {t('common:search')}
          </PopOverLink>
          <PopOverLink href='/signup'>{t('common:profile')}</PopOverLink>
          <PopOverLink href='/dashboard'>{t('common:dashboard')}</PopOverLink>
          {orgs.map((org: OrgJSON) => (
            <>
              <div className={styles.line} />
              <PopOverAccountHeader account={org} />
              <PopOverLink href='/[org]' as={`/${org.id}`}>
                {t('common:home')}
              </PopOverLink>
              <PopOverLink
                href='/[org]/search/[[...slug]]'
                as={`/${org.id}/search`}
              >
                {t('common:search')}
              </PopOverLink>
              <PopOverLink href='/[org]/people' as={`/${org.id}/people`}>
                {t('common:people')}
              </PopOverLink>
              <PopOverLink href='/[org]/matches' as={`/${org.id}/matches`}>
                {t('common:matches')}
              </PopOverLink>
            </>
          ))}
          <div className={styles.line} />
          <PopOverButton
            icon='add'
            onClick={() =>
              IntercomAPI('showNewMessage', t('common:new-org-msg'))
            }
          >
            {t('common:new-org-btn')}
          </PopOverButton>
          <PopOverButton
            icon='contact_support'
            onClick={() => IntercomAPI('show')}
          >
            {t('common:launch-intercom')}
          </PopOverButton>
          <div className={styles.line} />
          <PopOverButton
            onClick={async () => {
              setLoggingOut(true);
              const { default: firebase } = await import('lib/firebase');
              await import('firebase/auth');
              await firebase.auth().signOut();
              await mutate('/api/account', new User().toJSON(), false);
            }}
          >
            {t(loggingOut ? 'common:logging-out' : 'common:logout')}
          </PopOverButton>
        </div>
      </MenuSurface>
    </MenuSurfaceAnchor>
  );
}
