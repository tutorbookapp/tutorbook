import React, { useState, useCallback } from 'react';
import QueryForm from 'components/query-form';
import Button from 'components/button';

import useTranslation from 'next-translate/useTranslation';

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
  onChange: onFinalChange,
  onClosed,
}: FilterDialogProps): JSX.Element {
  const [query, setQuery] = useState<UsersQuery>(value);
  const onChange = useCallback((updated: UsersQuery) => setQuery(updated), []);
  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onFinalChange(query);
      onClosed();
    },
    [onClosed, onChange]
  );

  const { t } = useTranslation();

  return (
    <Dialog open onClosed={onClosed} className={styles.dialog}>
      <div className={styles.wrapper}>
        <div className={styles.nav}>
          <IconButton className={styles.btn} icon='close' onClick={onClosed} />
        </div>
        <div className={styles.content}>
          <form className={styles.form} onSubmit={onSubmit}>
            <QueryForm
              query={query}
              onChange={onChange}
              renderToPortal
              vertical
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
