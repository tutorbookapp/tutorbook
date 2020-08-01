import React from 'react';

import styles from './create-user-dialog.module.scss';

export interface RequestPageProps {
  value: UserJSON;
  openDisplay: () => void;
}

export default function RequestPage({
  value,
  openDisplay,
}: RequestPageProps): JSX.Element {
  return <div className={styles.requestPage} />;
}
