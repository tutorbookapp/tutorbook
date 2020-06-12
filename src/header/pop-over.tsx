import React from 'react';
import Avatar from '@tutorbook/avatar';

import { Icon } from '@rmwc/icon';
import { Ripple } from '@rmwc/ripple';
import { Link } from '@tutorbook/intl';
import { Account } from '@tutorbook/model';
import { useAccount } from '@tutorbook/firebase';

import styles from './pop-over.module.scss';

interface PopOverLinkProps {
  href: string;
  children: string;
  icon?: string;
}

function PopOverLink({ href, children, icon }: PopOverLinkProps): JSX.Element {
  return (
    <Ripple>
      <div className={styles.item}>
        <a className={styles.itemLink} href={href}>
          {children}
        </a>
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
        {children}
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
  onClick: () => void;
  checked?: boolean;
}

function PopOverAccount({
  account,
  onClick,
  checked,
}: PopOverAccountProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.item}>
        <div className={styles.avatar}>
          <Avatar src={account.photo} />
        </div>
        {account.name}
        {checked && (
          <div className={styles.icon}>
            <Icon icon='account_circle' />
          </div>
        )}
      </button>
    </Ripple>
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
  const { account, accounts, switchAccount, signout } = useAccount();
  const menuRef: React.RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();

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

  return (
    <div className={styles.anchor + (open ? ` ${styles.open}` : '')}>
      {children}
      <div
        ref={menuRef}
        className={styles.wrapper + (open ? ` ${styles.open}` : '')}
      >
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
              {accounts.map((a) =>
                a.id === account.id ? (
                  <Link href='/signup'>
                    <PopOverAccount
                      account={account}
                      onClick={() => {}}
                      checked
                    />
                  </Link>
                ) : (
                  <PopOverAccount
                    key={a.id}
                    account={a}
                    onClick={() => switchAccount(a.id)}
                  />
                )
              )}
              <div className={styles.line} />
              <PopOverButton onClick={() => signout()}>Logout</PopOverButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
