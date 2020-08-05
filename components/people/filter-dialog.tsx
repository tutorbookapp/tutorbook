import React, { useCallback, useState } from 'react';
import Button from 'components/button';

import useTranslation from 'next-translate/useTranslation';

import { QueryInputs } from 'components/inputs';
import { IconButton } from '@rmwc/icon-button';
import { UsersQuery, Callback } from 'lib/model';
import { Dialog } from '@rmwc/dialog';

import styles from './filter-dialog.module.scss';

export interface FilterDialogProps {
  value: UsersQuery;
  onChange: Callback<UsersQuery>;
  onClosed: () => void;
}

export default function FilterDialog({
  value,
  onChange,
  onClosed,
}: FilterDialogProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(true);
  const onClick = useCallback(() => setOpen(false), []);
  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onClosed();
    },
    [onClosed]
  );

  const { t } = useTranslation();

  return (
    <Dialog open={open} onClosed={onClosed} className={styles.dialog}>
      <div className={styles.wrapper}>
        <div className={styles.nav}>
          <IconButton className={styles.btn} icon='close' onClick={onClick} />
        </div>
        <div className={styles.content}>
          <form className={styles.form} onSubmit={onSubmit}>
            <QueryInputs
              value={value}
              onChange={onChange}
              className={styles.field}
              renderToPortal
              availability
              subjects
              langs
            />
            <Button
              className={styles.btn}
              label={t('query:submit')}
              raised
              arrow
            />
          </form>
        </div>
      </div>
    </Dialog>
  );
}
