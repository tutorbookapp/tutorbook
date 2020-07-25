import React, { useState } from 'react';

import Router from 'next/router';
import Avatar from 'components/avatar';
import firebase from 'lib/firebase';
import 'firebase/auth';

import { mutate } from 'swr';
import { useMsg, useIntl, Link } from 'lib/intl';
import { useUser, useOrgs } from 'lib/account';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { OrgJSON, User, AccountInterface } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';
import { defineMessages } from 'react-intl';
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
  checked?: boolean;
}

export function PopOverAccountButton({
  account,
  onClick,
  checked,
}: { onClick: () => void } & PopOverAccountProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.item}>
        {checked && (
          <div className={styles.icon}>
            <Icon icon='account_circle' />
          </div>
        )}
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
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={`${styles.item} ${styles.header}`}>
      <div className={styles.avatar}>
        <Avatar src={account.photo} />
      </div>
      <span className={styles.label}>{account.name}</span>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

export function PopOverAccountLink({
  account,
  href,
  as,
  checked,
}: { href: string; as?: string } & PopOverAccountProps): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <Ripple>
      <div className={styles.item}>
        <Link href={href} as={as}>
          <a className={styles.itemLink}>
            {checked && (
              <div className={styles.icon}>
                <Icon icon='account_circle' />
              </div>
            )}
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
  const msg = useMsg();
  const msgs = defineMessages({
    logoutLabel: {
      id: 'pop-over.logout.label',
      defaultMessage: 'Logout',
    },
    loggingOutLabel: {
      id: 'pop-over.logout.logging-out',
      defaultMessage: 'Logging out...',
    },
    newOrgMsg: {
      id: 'pop-over.create-org.message',
      defaultMessage: "I'd like to create a new organization.",
    },
    newOrgLabel: {
      id: 'pop-over.create-org.label',
      defaultMessage: 'Create an Organization',
    },
    people: {
      id: 'pop-over.links.people',
      defaultMessage: 'People',
    },
    appts: {
      id: 'pop-over.links.appts',
      defaultMessage: 'Appointments',
    },
    search: {
      id: 'pop-over.links.search',
      defaultMessage: 'Search',
    },
    home: {
      id: 'pop-over.links.home',
      defaultMessage: 'Home',
    },
    dashboard: {
      id: 'pop-over.links.dashboard',
      defaultMessage: 'Dashboard',
    },
    profile: {
      id: 'pop-over.links.profile',
      defaultMessage: 'Profile',
    },
  });

  const { orgs } = useOrgs();
  const { user } = useUser();
  const { locale } = useIntl();

  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  return (
    <MenuSurfaceAnchor>
      {children}
      <MenuSurface open={open} onClose={onClose}>
        <div className={styles.picker}>
          <PopOverAccountHeader account={user} />
          <PopOverLink href='/'>{msg(msgs.home)}</PopOverLink>
          <PopOverLink href='/search'>{msg(msgs.search)}</PopOverLink>
          <PopOverLink href='/signup'>{msg(msgs.profile)}</PopOverLink>
          <PopOverLink href='/dashboard'>{msg(msgs.dashboard)}</PopOverLink>
          {orgs.map((org: OrgJSON) => (
            <>
              <div className={styles.line} />
              <PopOverAccountHeader account={org} />
              <PopOverLink href='/[org]' as={`/${org.id}`}>
                {msg(msgs.home)}
              </PopOverLink>
              <PopOverLink href='/[org]/search' as={`/${org.id}/search`}>
                {msg(msgs.search)}
              </PopOverLink>
              <PopOverLink
                href='/[org]/dashboard/people'
                as={`/${org.id}/dashboard/people`}
              >
                {msg(msgs.people)}
              </PopOverLink>
              <PopOverLink
                href='/[org]/dashboard/appts'
                as={`/${org.id}/dashboard/appts`}
              >
                {msg(msgs.appts)}
              </PopOverLink>
            </>
          ))}
          <div className={styles.line} />
          <PopOverButton
            icon='add'
            onClick={() => IntercomAPI('showNewMessage', msg(msgs.newOrgMsg))}
          >
            {msg(msgs.newOrgLabel)}
          </PopOverButton>
          <div className={styles.line} />
          <PopOverButton
            onClick={async () => {
              setLoggingOut(true);
              await firebase.auth().signOut();
              await mutate('/api/account', new User().toJSON(), false);
              await Router.push('/[locale]/login', `/${locale}/login`);
            }}
          >
            {msg(loggingOut ? msgs.loggingOutLabel : msgs.logoutLabel)}
          </PopOverButton>
        </div>
      </MenuSurface>
    </MenuSurfaceAnchor>
  );
}
