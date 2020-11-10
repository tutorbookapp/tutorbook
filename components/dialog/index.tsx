import {
  Dialog as MDCDialog,
  DialogProps as MDCDialogProps,
} from '@rmwc/dialog';
import { IconButton } from '@rmwc/icon-button';
import cn from 'classnames';
import { useState } from 'react';

import Loader from 'components/loader';

import { Callback } from 'lib/model';

import styles from './dialog.module.scss';

interface UniqueDialogProps {
  active: number;
  setActive: Callback<number>;
  loading?: boolean;
  checked?: boolean;
  children: JSX.Element[];
  className?: string;
}

export type DialogProps = Omit<MDCDialogProps, 'open'> & UniqueDialogProps;

/**
 * Wrapper around the MDCDialog component that provides multi-page navigation
 * animations using the Web Animations API. All other params not listed below
 * will be passed to the MDCDialog component itself.
 * @param children - The different pages within the app. The first page always
 * has to be the display page (i.e. the page from which you close the dialog).
 * @param loading - Whether or not a loader (that prevents user input) is shown
 * on top of the entire dialog.
 * @param active - The index of the active page. Must be within the range of
 * indices provided by `children`.
 */
export default function Dialog({
  active,
  setActive,
  loading,
  checked,
  children,
  ...rest
}: DialogProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <MDCDialog
      {...rest}
      open={open}
      className={cn(styles.dialog, rest.className)}
    >
      {children.map((page, idx) => (
        <div className={cn(styles.page, { [styles.active]: active === idx })}>
          <div className={styles.wrapper}>
            <Loader active={!!loading} checked={!!checked} />
            <div className={styles.nav}>
              <IconButton
                icon='close'
                className={styles.btn}
                onClick={() => (idx === 0 ? setOpen(false) : setActive(0))}
              />
            </div>
            {page}
          </div>
        </div>
      ))}
    </MDCDialog>
  );
}
