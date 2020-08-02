import React, { memo, useState } from 'react';
import Inputs from 'components/request-dialog/inputs';
import Loader from 'components/loader';

import { IconButton } from '@rmwc/icon-button';
import { UserJSON } from 'lib/model';

import styles from './edit-page.module.scss';

export interface RequestPageProps {
  value: UserJSON;
  openDisplay: () => Promise<void>;
}

export default memo(function RequestPage({
  value,
  openDisplay,
}: RequestPageProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  return (
    <div className={styles.wrapper}>
      <Loader active={loading} checked={checked} />
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={openDisplay} />
      </div>
      <div className={styles.content}>
        <div className={styles.form}>
          <Inputs
            setLoading={setLoading}
            setChecked={setChecked}
            user={value}
          />
        </div>
      </div>
    </div>
  );
});
