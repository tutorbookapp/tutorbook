import React from 'react';

import styles from './switch-account.module.scss';

export default function CreateOrg(): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.header}>Create an Organization</h2>
      <p className={styles.body}>
        You must create and sign into an organization account to view anything
        useful in this dashboard.
      </p>
    </div>
  );
}
