import React from 'react';
import Avatar from '@tutorbook/avatar';

import { Icon } from '@rmwc/icon';
import { Ripple } from '@rmwc/ripple';

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

interface PopOverAccountProps {
  photo: string;
  name: string;
  onClick: () => void;
}

function PopOverAccount({
  name,
  photo,
  onClick,
}: PopOverAccountProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.item}>
        <div className={styles.avatar}>
          <Avatar src={photo} />
        </div>
        {name}
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
              <PopOverAccount
                name='Project Access'
                photo='https://firebasestorage.googleapis.com/v0/b/covid-tutoring.appspot.com/o/default%2Fusers%2FzsSQBJk9NTZQqzpvKb6m3XnuMkw2.png?alt=media&token=e822cb84-e578-49ec-94c3-853395d43f31'
              />
              <PopOverAccount
                name='StudyRoom'
                photo='https://firebasestorage.googleapis.com/v0/b/covid-tutoring.appspot.com/o/default%2Fusers%2FubyXSJtLxHfICLasqfgSAsIPyDE3.jpeg?alt=media&token=1296bce5-6a50-4a8e-ac48-9c89e0f205d4'
              />
              <div className={styles.line} />
              <PopOverLink href='/dashboard' icon='add'>
                New Account
              </PopOverLink>
              <div className={styles.line} />
              <PopOverLink href='/dashboard'>Dashboard</PopOverLink>
              <PopOverLink href='/dashboard'>Contact Support</PopOverLink>
              <div className={styles.line} />
              <PopOverLink href='/dashboard'>Logout</PopOverLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
