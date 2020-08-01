import React, { memo } from 'react';

import styles from './create-user-dialog.module.scss';

export interface RequestPageProps {
  value: UserJSON;
  openDisplay: () => void;
}

export default memo(function RequestPage({
  value,
  openDisplay,
}: RequestPageProps): JSX.Element {
  return <div className={styles.requestPage} />;
});
