import { useUser } from '@tutorbook/account';

import React from 'react';
import Utils from '@tutorbook/utils';
import Title from './title';

import styles from './overview.module.scss';

export default function Overview(): JSX.Element {
  const { user } = useUser();

  return (
    <>
      <Title
        header='Overview'
        body={Utils.period(`Analytics dashboard for ${user.name}`)}
        actions={[
          {
            label: 'View search',
            href: '/search/[[...slug]]',
            as: '/search',
          },
        ]}
      />
      <div className={styles.results}>
        <div className={styles.empty}>COMING SOON</div>
      </div>
    </>
  );
}
