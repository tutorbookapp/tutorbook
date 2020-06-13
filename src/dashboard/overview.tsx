import { v4 as uuid } from 'uuid';
import { useAccount } from '@tutorbook/firebase';

import React from 'react';
import Button from '@tutorbook/button';
import Avatar from '@tutorbook/avatar';
import Result from '@tutorbook/search/result';

import styles from './overview.module.scss';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export default function Overview(): JSX.Element {
  const { account } = useAccount();
  const bioRef = React.createRef<HTMLParagraphElement>();
  const truncateBio = async () => {
    if (!canUseDOM) return;
    const Dotdotdot = (await import('dotdotdot-js')).default;
    if (bioRef.current) new Dotdotdot(bioRef.current, { watch: true });
  };

  React.useEffect(() => {
    void truncateBio();
  });

  return (
    <>
      <header className={styles.wrapper}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.avatar}>
              <Avatar src={account.photo} />
            </div>
            <div className={styles.title}>
              <h1 className={styles.header}>{account.name}</h1>
              <p ref={bioRef} className={styles.body}>
                {account.bio}
              </p>
            </div>
          </div>
          <div className={styles.right}>
            <Button
              className={styles.button}
              arrow
              raised
              label='Search volunteers'
            />
          </div>
        </div>
      </header>
      <ul className={styles.results}>
        {Array(5)
          .fill(null)
          .map(() => (
            <Result loading key={uuid()} />
          ))}
      </ul>
    </>
  );
}
