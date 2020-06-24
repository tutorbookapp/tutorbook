import React from 'react';
import Router from 'next/router';
import Avatar from '@tutorbook/avatar';

import firebase from '@tutorbook/firebase';
import 'firebase/auth';

import { mutate } from 'swr';
import { useIntl } from '@tutorbook/intl';

import { User } from '@tutorbook/model';
import { Icon } from '@rmwc/icon';
import { Ripple } from '@rmwc/ripple';
import { Link } from '@tutorbook/intl';
import { Account } from '@tutorbook/model';

import styles from './pop-over.module.scss';

interface PopOverLinkProps {
  href: string;
  as?: string;
  children: string;
  icon?: string;
}

function PopOverLink({
  href,
  as,
  children,
  icon,
}: PopOverLinkProps): JSX.Element {
  return (
    <Ripple>
      <div className={styles.item}>
        <Link href={href} as={as}>
          <a className={styles.itemLink}>{children}</a>
        </Link>
        {icon && (
          <div className={styles.icon}>
            <Icon icon={icon} />
          </div>
        )}
      </div>
    </Ripple>
  );
}

interface PopOverButtonProps {
  onClick: () => void;
  children: string;
  icon?: string;
}

function PopOverButton({
  onClick,
  children,
  icon,
}: PopOverButtonProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.item}>
        <span className={styles.label}>{children}</span>
        {icon && (
          <div className={styles.icon}>
            <Icon icon={icon} />
          </div>
        )}
      </button>
    </Ripple>
  );
}

interface PopOverAccountProps {
  account: Account;
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
        <div className={styles.avatar}>
          <Avatar src={account.photo} />
        </div>
        <span className={styles.label}>{account.name}</span>
        {checked && (
          <div className={styles.icon}>
            <Icon icon='account_circle' />
          </div>
        )}
      </button>
    </Ripple>
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
            <div className={styles.avatar}>
              <Avatar src={account.photo} />
            </div>
            <span className={styles.label}>{account.name}</span>
            {checked && (
              <div className={styles.icon}>
                <Icon icon='account_circle' />
              </div>
            )}
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
  const { locale } = useIntl();
  const menuRef: React.RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();
  const [visible, setVisible] = React.useState<boolean>(open);
  const [closing, setClosing] = React.useState<boolean>(false);
  const [loggingOut, setLoggingOut] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!menuRef.current) return () => {};

    const element: HTMLElement = menuRef.current;
    const removeClickListener = () => {
      /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
      document.removeEventListener('click', outsideClickListener);
    };
    const outsideClickListener = (event: MouseEvent) => {
      if (!element.contains(event.target as Node) && open) {
        onClose();
        removeClickListener();
      }
    };

    document.addEventListener('click', outsideClickListener);

    return removeClickListener;
  });

  React.useEffect(() => {
    // Workaround to ensure `visibility` stays `visible` while animating the
    // opacity and elevation (during closing).
    if (!open) {
      setClosing(true);
      setTimeout(() => setVisible(false), 500);
    } else {
      setClosing(false);
      setVisible(true);
    }
  }, [open]);

  return (
    <div
      className={
        styles.anchor +
        (visible ? ` ${styles.visible}` : '') +
        (closing ? ` ${styles.closing}` : '')
      }
    >
      {children}
      <div ref={menuRef} className={styles.wrapper}>
        <div className={styles.inner}>
          <div className={styles.up}>
            <div className={styles.triangle}>
              <svg width='24' height='8' viewBox='0 0 24 8'>
                <path
                  className={styles.path}
                  strokeWidth='1px'
                  fillRule='evenodd'
                  d='M20 12l-8-8-12 12'
                />
              </svg>
            </div>
            <div className={styles.menu}>
              <PopOverLink href='/signup'>Profile</PopOverLink>
              <PopOverLink href='/dashboard'>Dashboard</PopOverLink>
              <div className={styles.line} />
              <PopOverLink href='/'>Home</PopOverLink>
              <div className={styles.line} />
              <PopOverButton
                onClick={async () => {
                  setLoggingOut(true);
                  await firebase.auth().signOut();
                  await mutate('/api/account', new User().toJSON(), false);
                  await Router.push('/[locale]/login', `/${locale}/login`);
                }}
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </PopOverButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
