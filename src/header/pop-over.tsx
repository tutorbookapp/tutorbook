import React from 'react';
import Avatar from '@tutorbook/avatar';

import { Icon } from '@rmwc/icon';
import { Ripple } from '@rmwc/ripple';
import { Link } from '@tutorbook/intl';
import { Org, Account } from '@tutorbook/model';
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
  checked?: boolean;
}

function PopOverAccountButton({
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

function PopOverAccountLink({
  account,
  href,
  checked,
}: { href: string } & PopOverAccountProps): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <Ripple>
      <div className={styles.item}>
        <Link href={href}>
          <a className={styles.itemLink}>
            <div className={styles.avatar}>
              <Avatar src={account.photo} />
            </div>
            {account.name}
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
  const { signout } = useAccount();
  const menuRef: React.RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();
  const [visible, setVisible] = React.useState<boolean>(open);
  const [closing, setClosing] = React.useState<boolean>(false);

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
              <PopOverButton onClick={() => signout()}>Logout</PopOverButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
